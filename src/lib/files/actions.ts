import type { SupabaseClient } from '@supabase/supabase-js';
import { createServiceClient } from '@/lib/supabase/admin';
import { sanitizeUploadFileName } from '@/lib/upload/client';
import type { FileRecord, TimelineEvent } from '@/types/database';

const BUCKET = () => process.env.SUPABASE_STORAGE_BUCKET || 'briefnexus-files';

export type FileLineage = {
  original_file_id?: string;
  original_project_id?: string;
  original_file_name?: string;
  transferred_at?: string;
  transfer_type?: 'move' | 'share';
  timeline_snapshot?: Array<{
    event_type: string;
    title: string;
    description: string | null;
    created_at: string;
  }>;
};

function lineageFrom(file: FileRecord): FileLineage {
  const existing = file.metadata?.lineage;
  if (existing && typeof existing === 'object') {
    return existing as FileLineage;
  }
  return {};
}

async function assertProjectAccess(
  supabase: SupabaseClient,
  projectId: string
): Promise<{ error?: string; status?: number }> {
  const { data, error } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .single();

  if (error || !data) {
    return { error: 'Project not found', status: 404 };
  }
  return {};
}

async function loadFile(
  supabase: SupabaseClient,
  fileId: string
): Promise<{ file?: FileRecord; error?: string; status?: number }> {
  const { data, error } = await supabase.from('files').select('*').eq('id', fileId).single();
  if (error || !data) {
    return { error: 'File not found', status: 404 };
  }
  return { file: data as FileRecord };
}

async function snapshotTimeline(
  supabase: SupabaseClient,
  fileId: string
): Promise<FileLineage['timeline_snapshot']> {
  const { data } = await supabase
    .from('timeline_events')
    .select('event_type, title, description, created_at')
    .eq('source_file_id', fileId)
    .order('created_at', { ascending: true });

  return (data ?? []).map((row) => ({
    event_type: row.event_type as string,
    title: row.title as string,
    description: (row.description as string | null) ?? null,
    created_at: row.created_at as string,
  }));
}

async function copyStorageObject(
  sourcePath: string,
  targetPath: string
): Promise<{ error?: string }> {
  const admin = createServiceClient();
  const bucket = BUCKET();
  const { error: copyError } = await admin.storage.from(bucket).copy(sourcePath, targetPath);
  if (copyError) {
    return { error: copyError.message };
  }
  return {};
}

async function removeStorageObject(storagePath: string | null): Promise<void> {
  if (!storagePath) return;
  const admin = createServiceClient();
  await admin.storage.from(BUCKET()).remove([storagePath]);
}

function buildTargetStoragePath(projectId: string, fileName: string): string {
  return `${projectId}/${Date.now()}-${sanitizeUploadFileName(fileName)}`;
}

export async function updateFileDetails(
  supabase: SupabaseClient,
  fileId: string,
  updates: { file_name?: string; user_note?: string | null }
): Promise<{ file?: FileRecord; error?: string; status?: number }> {
  const loaded = await loadFile(supabase, fileId);
  if (!loaded.file) {
    return { error: loaded.error, status: loaded.status };
  }

  const patch: Record<string, unknown> = {};
  if (updates.file_name !== undefined) {
    const trimmed = updates.file_name.trim();
    if (!trimmed) {
      return { error: 'File name is required', status: 400 };
    }
    patch.file_name = trimmed;
  }
  if (updates.user_note !== undefined) {
    patch.user_note = updates.user_note?.trim() || null;
  }

  if (Object.keys(patch).length === 0) {
    return { file: loaded.file };
  }

  const { data, error } = await supabase
    .from('files')
    .update(patch)
    .eq('id', fileId)
    .select('*')
    .single();

  if (error || !data) {
    return { error: error?.message ?? 'Failed to update file', status: 500 };
  }

  return { file: data as FileRecord };
}

export async function moveFileToProject(
  supabase: SupabaseClient,
  fileId: string,
  targetProjectId: string
): Promise<{ file?: FileRecord; error?: string; status?: number }> {
  const loaded = await loadFile(supabase, fileId);
  if (!loaded.file) {
    return { error: loaded.error, status: loaded.status };
  }

  const file = loaded.file;
  if (file.project_id === targetProjectId) {
    return { error: 'File is already in this project', status: 400 };
  }

  const access = await assertProjectAccess(supabase, targetProjectId);
  if (access.error) {
    return access;
  }

  const timelineSnapshot = await snapshotTimeline(supabase, fileId);
  const previousProjectId = file.project_id;
  let nextStoragePath = file.storage_path;

  if (file.storage_path) {
    nextStoragePath = buildTargetStoragePath(targetProjectId, file.file_name);
    const copied = await copyStorageObject(file.storage_path, nextStoragePath);
    if (copied.error) {
      return { error: `Failed to move file in storage: ${copied.error}`, status: 500 };
    }
    await removeStorageObject(file.storage_path);
  }

  const nextLineage: FileLineage = {
    ...lineageFrom(file),
    original_file_id: file.origin_file_id ?? file.id,
    original_project_id: lineageFrom(file).original_project_id ?? previousProjectId,
    original_file_name: lineageFrom(file).original_file_name ?? file.file_name,
    transferred_at: new Date().toISOString(),
    transfer_type: 'move',
    timeline_snapshot: timelineSnapshot,
  };

  const { data: updated, error: updateError } = await supabase
    .from('files')
    .update({
      project_id: targetProjectId,
      storage_path: nextStoragePath,
      metadata: { ...file.metadata, lineage: nextLineage },
    })
    .eq('id', fileId)
    .select('*')
    .single();

  if (updateError || !updated) {
    return { error: updateError?.message ?? 'Failed to move file', status: 500 };
  }

  await supabase.from('chunks').update({ project_id: targetProjectId }).eq('file_id', fileId);
  await supabase.from('entities').update({ project_id: targetProjectId }).eq('source_file_id', fileId);
  await supabase
    .from('timeline_events')
    .update({ project_id: targetProjectId })
    .eq('source_file_id', fileId);

  await supabase.from('timeline_events').insert([
    {
      project_id: previousProjectId,
      event_type: 'file_moved',
      title: `Moved: ${file.file_name}`,
      description: `File moved to another project workspace.`,
      source_file_id: null,
      metadata: { file_id: fileId, target_project_id: targetProjectId },
    },
    {
      project_id: targetProjectId,
      event_type: 'file_moved',
      title: `Received: ${file.file_name}`,
      description: `File moved from another project workspace.`,
      source_file_id: fileId,
      metadata: { source_project_id: previousProjectId, timeline_snapshot: timelineSnapshot },
    },
  ]);

  return { file: updated as FileRecord };
}

export async function shareFileToProject(
  supabase: SupabaseClient,
  fileId: string,
  targetProjectId: string
): Promise<{ file?: FileRecord; error?: string; status?: number }> {
  const loaded = await loadFile(supabase, fileId);
  if (!loaded.file) {
    return { error: loaded.error, status: loaded.status };
  }

  const source = loaded.file;
  if (source.project_id === targetProjectId) {
    return { error: 'File is already in this project', status: 400 };
  }

  const access = await assertProjectAccess(supabase, targetProjectId);
  if (access.error) {
    return access;
  }

  const timelineSnapshot = await snapshotTimeline(supabase, fileId);
  let sharedStoragePath: string | null = null;

  if (source.storage_path) {
    sharedStoragePath = buildTargetStoragePath(targetProjectId, source.file_name);
    const copied = await copyStorageObject(source.storage_path, sharedStoragePath);
    if (copied.error) {
      return { error: `Failed to copy file in storage: ${copied.error}`, status: 500 };
    }
  }

  const lineage: FileLineage = {
    original_file_id: source.origin_file_id ?? source.id,
    original_project_id: lineageFrom(source).original_project_id ?? source.project_id,
    original_file_name: lineageFrom(source).original_file_name ?? source.file_name,
    transferred_at: new Date().toISOString(),
    transfer_type: 'share',
    timeline_snapshot: timelineSnapshot,
  };

  const { data: sharedFile, error: insertError } = await supabase
    .from('files')
    .insert({
      project_id: targetProjectId,
      uploaded_by: source.uploaded_by,
      file_name: source.file_name,
      file_type: source.file_type,
      source_type: source.source_type,
      storage_path: sharedStoragePath,
      extracted_text: source.extracted_text,
      status: source.status,
      user_note: source.user_note,
      origin_file_id: source.id,
      metadata: { ...source.metadata, lineage, shared_from_project_id: source.project_id },
    })
    .select('*')
    .single();

  if (insertError || !sharedFile) {
    if (sharedStoragePath) {
      await removeStorageObject(sharedStoragePath);
    }
    return { error: insertError?.message ?? 'Failed to share file', status: 500 };
  }

  const { data: chunks } = await supabase.from('chunks').select('*').eq('file_id', fileId);
  if (chunks?.length) {
    await supabase.from('chunks').insert(
      chunks.map((chunk) => ({
        project_id: targetProjectId,
        file_id: sharedFile.id,
        chunk_index: chunk.chunk_index,
        text: chunk.text,
        metadata: chunk.metadata,
        embedding: chunk.embedding,
      }))
    );
  }

  await supabase.from('timeline_events').insert({
    project_id: targetProjectId,
    event_type: 'file_shared',
    title: `Shared: ${source.file_name}`,
    description: `Copy shared from another project workspace.`,
    source_file_id: sharedFile.id,
    metadata: {
      source_file_id: source.id,
      source_project_id: source.project_id,
      timeline_snapshot: timelineSnapshot,
    },
  });

  await supabase.from('timeline_events').insert({
    project_id: source.project_id,
    event_type: 'file_shared',
    title: `Shared copy: ${source.file_name}`,
    description: `A copy was shared to another project workspace.`,
    source_file_id: source.id,
    metadata: { target_project_id: targetProjectId, shared_file_id: sharedFile.id },
  });

  return { file: sharedFile as FileRecord };
}

export async function removeFileFromProject(
  supabase: SupabaseClient,
  fileId: string,
  projectId: string
): Promise<{ error?: string; status?: number }> {
  const loaded = await loadFile(supabase, fileId);
  if (!loaded.file) {
    return { error: loaded.error, status: loaded.status };
  }

  const file = loaded.file;
  if (file.project_id !== projectId) {
    return { error: 'File is not in this project', status: 400 };
  }

  if (file.origin_file_id) {
    await supabase.from('chunks').delete().eq('file_id', fileId);
    if (file.storage_path) {
      await removeStorageObject(file.storage_path);
    }
    const { error } = await supabase.from('files').delete().eq('id', fileId);
    if (error) {
      return { error: error.message, status: 500 };
    }
    return {};
  }

  if (file.storage_path) {
    await removeStorageObject(file.storage_path);
  }
  const { error } = await supabase.from('files').delete().eq('id', fileId);
  if (error) {
    return { error: error.message, status: 500 };
  }
  return {};
}

export function mergeTimelineSnapshots(events: TimelineEvent[], snapshot?: FileLineage['timeline_snapshot']) {
  if (!snapshot?.length) return events;
  const synthetic = snapshot.map((item, index) => ({
    id: `lineage-${index}`,
    project_id: '',
    event_type: item.event_type as TimelineEvent['event_type'],
    title: item.title,
    description: item.description,
    source_file_id: null,
    metadata: { lineage: true },
    created_at: item.created_at,
  }));
  return [...synthetic, ...events];
}
