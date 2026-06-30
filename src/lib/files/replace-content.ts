import type { SupabaseClient } from '@supabase/supabase-js';
import { createServiceClient } from '@/lib/supabase/admin';
import { inferSourceType } from '@/lib/constants';
import { enqueueFileProcessing } from '@/lib/processing/enqueue';
import { isProcessingActive } from '@/lib/processing/progress';
import { sanitizeUploadFileName } from '@/lib/upload/client';
import { buildUploadSizeMetadata } from '@/lib/upload/size-hints';
import type { FileRecord } from '@/types/database';
import { purgeFileDerivedContent } from '@/lib/files/purge-derived-content';

const BUCKET = () => process.env.SUPABASE_STORAGE_BUCKET || 'briefnexus-files';

export type ProjectFileSummary = { id: string; file_name: string };

export function normalizeUploadFileName(fileName: string): string {
  return sanitizeUploadFileName(fileName).toLowerCase();
}

export function findProjectFileByUploadName(
  files: ProjectFileSummary[],
  uploadName: string
): ProjectFileSummary | null {
  const normalized = normalizeUploadFileName(uploadName);
  return files.find((file) => normalizeUploadFileName(file.file_name) === normalized) ?? null;
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

async function removeStorageObject(storagePath: string | null): Promise<void> {
  if (!storagePath) return;
  const admin = createServiceClient();
  await admin.storage.from(BUCKET()).remove([storagePath]);
}

function buildStoragePath(projectId: string, fileName: string): string {
  return `${projectId}/${Date.now()}-${sanitizeUploadFileName(fileName)}`;
}

/** Replace stored content for an existing file row and re-index Sunny memory in place. */
export async function replaceProjectFileContent(
  supabase: SupabaseClient,
  fileId: string,
  options: {
    buffer: Buffer;
    fileName: string;
    mimeType: string;
  }
): Promise<{ file?: FileRecord; error?: string; status?: number }> {
  const loaded = await loadFile(supabase, fileId);
  if (!loaded.file) {
    return { error: loaded.error, status: loaded.status };
  }

  const existing = loaded.file;
  if (
    existing.status === 'pending' ||
    isProcessingActive(existing.status, (existing.metadata ?? {}) as Record<string, unknown>)
  ) {
    return { error: 'File is still processing. Wait until indexing finishes, then replace.', status: 409 };
  }

  const previousText = existing.extracted_text?.trim() ?? '';
  const pendingReplacement =
    previousText.length > 0
      ? {
          previous_text: previousText,
          replaced_at: new Date().toISOString(),
        }
      : null;

  const fileName = sanitizeUploadFileName(options.fileName);
  const mimeType = options.mimeType || 'application/octet-stream';
  const sourceType = inferSourceType(fileName, mimeType);
  const storagePath = buildStoragePath(existing.project_id, fileName);

  await purgeFileDerivedContent(supabase, existing.project_id, existing.id, existing.file_name);
  await removeStorageObject(existing.storage_path);

  const admin = createServiceClient();
  const { error: uploadError } = await admin.storage.from(BUCKET()).upload(storagePath, options.buffer, {
    contentType: mimeType,
    upsert: false,
  });

  if (uploadError) {
    return { error: `Failed to store replacement file: ${uploadError.message}`, status: 500 };
  }

  const metadata = {
    ...((existing.metadata as Record<string, unknown> | undefined) ?? {}),
    ...buildUploadSizeMetadata(options.buffer.length),
    replaced_at: new Date().toISOString(),
    ...(pendingReplacement ? { pending_replacement: pendingReplacement } : {}),
    processing_phase: 'extract',
    processing_lock: null,
    processing_progress: {
      stage: 'queued',
      percent: 0,
      label: 'Queued for re-indexing…',
      updated_at: new Date().toISOString(),
    },
  };

  const { data, error } = await supabase
    .from('files')
    .update({
      file_name: fileName,
      file_type: mimeType,
      source_type: sourceType,
      storage_path: storagePath,
      extracted_text: null,
      status: 'pending',
      metadata,
    })
    .eq('id', fileId)
    .select('*')
    .single();

  if (error || !data) {
    await removeStorageObject(storagePath);
    return { error: error?.message ?? 'Failed to update file record', status: 500 };
  }

  enqueueFileProcessing(fileId, { resume: false, force: true });
  return { file: data as FileRecord };
}
