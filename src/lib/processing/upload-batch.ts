import type { SupabaseClient } from '@supabase/supabase-js';
import { generateBatchSunnyUpdate, generateSunnyUpdate } from '@/lib/ai/sunny';
import { formatNaturalSummary } from '@/lib/ai/generation-prompts';
import type { Citation, SourceType } from '@/types/database';

export const UPLOAD_BATCH_ID_KEY = 'upload_batch_id';
export const UPLOAD_BATCH_TOTAL_KEY = 'upload_batch_total';
export const PROCESSING_SUMMARY_KEY = 'processing_summary';

type ProjectRef = { client_name: string; project_name: string };

function asProjectRef(value: unknown): ProjectRef | null {
  if (!value) return null;
  if (Array.isArray(value)) return (value[0] as ProjectRef | undefined) ?? null;
  return value as ProjectRef;
}

type BatchFileRow = {
  id: string;
  file_name: string;
  source_type: SourceType;
  status: string;
  metadata: Record<string, unknown> | null;
};

export type ActiveUploadBatch = {
  batchId: string;
  projectId: string;
  projectName: string;
  clientName: string;
  fileNames: string[];
  total: number;
  done: number;
  processing: number;
};

const TERMINAL_STATUSES = new Set(['processed', 'failed', 'uploaded_unprocessed']);

export function getUploadBatchInfo(metadata: Record<string, unknown> | null | undefined): {
  batchId: string | null;
  batchTotal: number;
} {
  const batchId =
    typeof metadata?.[UPLOAD_BATCH_ID_KEY] === 'string' ? metadata[UPLOAD_BATCH_ID_KEY] : null;
  const batchTotalRaw = metadata?.[UPLOAD_BATCH_TOTAL_KEY];
  const batchTotal =
    typeof batchTotalRaw === 'number' && batchTotalRaw > 0 ? batchTotalRaw : 1;
  return { batchId, batchTotal: batchId ? batchTotal : 1 };
}

export function isMultiFileBatch(metadata: Record<string, unknown> | null | undefined): boolean {
  const { batchId, batchTotal } = getUploadBatchInfo(metadata);
  return Boolean(batchId && batchTotal > 1);
}

export function buildUploadBatchMetadata(options: {
  uploadBatchId?: string | null;
  uploadBatchTotal?: number;
  extra?: Record<string, unknown>;
}): Record<string, unknown> {
  const meta: Record<string, unknown> = { ...(options.extra ?? {}) };
  if (options.uploadBatchId && (options.uploadBatchTotal ?? 0) > 1) {
    meta[UPLOAD_BATCH_ID_KEY] = options.uploadBatchId;
    meta[UPLOAD_BATCH_TOTAL_KEY] = options.uploadBatchTotal;
  }
  return meta;
}

export function isLowSignalSummary(summary: string, extractedTextLength?: number): boolean {
  const normalized = summary.trim().toLowerCase();
  if (!normalized) return true;
  if (normalized.length < 50) return true;
  if (extractedTextLength !== undefined && extractedTextLength < 80) return true;

  const boilerplate = [
    'new project material has been added and indexed',
    'review the uploaded content for any follow-up needed',
    'no text could be extracted',
    'no readable',
    'stored but not processed',
    'file stored but not processed',
  ];

  return boilerplate.some((phrase) => normalized.includes(phrase));
}

function fileSummaryFromMetadata(file: BatchFileRow): string {
  const meta = file.metadata ?? {};
  const stored = meta[PROCESSING_SUMMARY_KEY];
  if (typeof stored === 'string' && stored.trim()) return stored.trim();
  if (file.status === 'failed') {
    const progress = meta.processing_progress as { detail?: string } | undefined;
    return progress?.detail ?? 'Processing failed';
  }
  return '';
}

function criticalCountFromMetadata(file: BatchFileRow): number {
  const value = file.metadata?.critical_item_count;
  return typeof value === 'number' ? value : 0;
}

async function loadBatchFiles(
  supabase: SupabaseClient,
  projectId: string,
  batchId: string
): Promise<BatchFileRow[]> {
  const { data } = await supabase
    .from('files')
    .select('id, file_name, source_type, status, metadata')
    .eq('project_id', projectId)
    .contains('metadata', { [UPLOAD_BATCH_ID_KEY]: batchId });

  return (data ?? []) as BatchFileRow[];
}

function batchIsComplete(files: BatchFileRow[]): boolean {
  return files.length > 0 && files.every((file) => TERMINAL_STATUSES.has(file.status));
}

async function claimBatchRollup(
  supabase: SupabaseClient,
  projectId: string,
  batchId: string
): Promise<boolean> {
  const { error } = await supabase.from('upload_batch_rollups').insert({
    batch_id: batchId,
    project_id: projectId,
  });

  if (error) {
    if (error.code === '23505') return false;
    throw error;
  }

  return true;
}

async function insertBatchTimelineEvents(
  supabase: SupabaseClient,
  projectId: string,
  batchId: string,
  files: BatchFileRow[],
  description: string,
  actionItemCount: number
): Promise<void> {
  const fileNames = files.map((file) => file.file_name);
  const batchMeta = {
    upload_batch_id: batchId,
    file_ids: files.map((file) => file.id),
    file_names: fileNames,
  };

  await supabase.from('timeline_events').insert([
    {
      project_id: projectId,
      event_type: 'file_upload',
      title: `Uploaded ${files.length} files`,
      description,
      metadata: batchMeta,
    },
    {
      project_id: projectId,
      event_type: 'sunny_summary',
      title: `Sunny reviewed ${files.length} new files`,
      description,
      metadata: batchMeta,
    },
  ]);

  if (actionItemCount > 0) {
    await supabase.from('timeline_events').insert({
      project_id: projectId,
      event_type: 'action_item',
      title: `${actionItemCount} action item(s) extracted`,
      description: `From ${files.length} uploaded files`,
      metadata: batchMeta,
    });
  }
}

export async function createSingleFileSunnyUpdate(options: {
  supabase: SupabaseClient;
  projectId: string;
  projectName: string;
  fileId: string;
  fileName: string;
  sourceType: SourceType;
  summary: string;
  extractedTextLength: number;
  criticalItems: Array<{ summary: string }>;
}): Promise<void> {
  const {
    supabase,
    projectId,
    projectName,
    fileId,
    fileName,
    sourceType,
    summary,
    extractedTextLength,
    criticalItems,
  } = options;

  const citation: Citation = {
    file_id: fileId,
    file_name: fileName,
    snippet: summary,
  };

  if (criticalItems.length > 0) {
    const update = await generateSunnyUpdate(
      projectName,
      criticalItems.map((item) => item.summary).join('\n')
    );

    await supabase.from('sunny_updates').insert({
      project_id: projectId,
      title: update.title,
      summary: update.summary,
      why_it_matters: update.why_it_matters,
      suggested_action: update.suggested_action,
      source_citations: [citation],
    });
    return;
  }

  if (isLowSignalSummary(summary, extractedTextLength)) {
    return;
  }

  await supabase.from('sunny_updates').insert({
    project_id: projectId,
    title: `New ${sourceType} processed: ${fileName}`,
    summary,
    why_it_matters: formatNaturalSummary('New project material has been added and indexed.'),
    suggested_action: formatNaturalSummary('Review the uploaded content for any follow-up needed.'),
    source_citations: [citation],
  });
}

export async function insertSingleFileTimelineEvents(options: {
  supabase: SupabaseClient;
  projectId: string;
  fileId: string;
  fileName: string;
  sourceType: SourceType;
  summary: string;
  actionItemCount: number;
}): Promise<void> {
  const { supabase, projectId, fileId, fileName, sourceType, summary, actionItemCount } =
    options;

  await supabase.from('timeline_events').insert([
    {
      project_id: projectId,
      event_type:
        sourceType === 'email' ? 'email' : sourceType === 'meeting' ? 'meeting' : 'file_upload',
      title: `Uploaded: ${fileName}`,
      description: summary,
      source_file_id: fileId,
    },
    {
      project_id: projectId,
      event_type: 'sunny_summary',
      title: `Sunny summarized: ${fileName}`,
      description: summary,
      source_file_id: fileId,
    },
  ]);

  if (actionItemCount > 0) {
    await supabase.from('timeline_events').insert({
      project_id: projectId,
      event_type: 'action_item',
      title: `${actionItemCount} action item(s) extracted`,
      description: `From ${fileName}`,
      source_file_id: fileId,
    });
  }
}

async function finalizeUploadBatchRollup(
  supabase: SupabaseClient,
  projectId: string,
  batchId: string,
  files: BatchFileRow[]
): Promise<void> {
  const { data: project } = await supabase
    .from('projects')
    .select('project_name, client_name')
    .eq('id', projectId)
    .single();

  const projectLabel = project?.project_name ?? 'Project';
  const fileSummaries = files.map((file) => ({
    fileName: file.file_name,
    status: file.status,
    summary: fileSummaryFromMetadata(file),
    criticalCount: criticalCountFromMetadata(file),
  }));

  const totalCriticalItems = fileSummaries.reduce((sum, file) => sum + file.criticalCount, 0);
  const citations: Citation[] = files.map((file) => ({
    file_id: file.id,
    file_name: file.file_name,
    snippet: fileSummaryFromMetadata(file).slice(0, 200),
  }));

  const combinedSummary = fileSummaries
    .map((file) => `${file.fileName}: ${file.summary || '(no summary)'}`)
    .join('\n');

  const allLowSignal =
    totalCriticalItems === 0 &&
    fileSummaries.every(
      (file) => !file.summary || isLowSignalSummary(file.summary)
    );

  let rollupSummary = combinedSummary;

  if (!allLowSignal) {
    const update = await generateBatchSunnyUpdate(projectLabel, fileSummaries);
    await supabase.from('sunny_updates').insert({
      project_id: projectId,
      title: update.title,
      summary: update.summary,
      why_it_matters: update.why_it_matters,
      suggested_action: update.suggested_action,
      source_citations: citations,
    });
    rollupSummary = update.summary;
  }

  const actionItemCount = files.reduce((sum, file) => {
    const count = file.metadata?.action_item_count;
    return sum + (typeof count === 'number' ? count : 0);
  }, 0);

  await insertBatchTimelineEvents(
    supabase,
    projectId,
    batchId,
    files,
    rollupSummary,
    actionItemCount
  );

  const latestSummary =
    fileSummaries.find((file) => file.summary && !isLowSignalSummary(file.summary))?.summary ??
    fileSummaries[0]?.summary ??
    rollupSummary;

  await supabase
    .from('projects')
    .update({
      last_summary: latestSummary,
      last_activity_at: new Date().toISOString(),
    })
    .eq('id', projectId);
}

export async function maybeFinalizeUploadBatch(
  supabase: SupabaseClient,
  projectId: string,
  batchId: string
): Promise<void> {
  const files = await loadBatchFiles(supabase, projectId, batchId);
  if (!batchIsComplete(files)) return;

  const claimed = await claimBatchRollup(supabase, projectId, batchId);
  if (!claimed) return;

  try {
    await finalizeUploadBatchRollup(supabase, projectId, batchId, files);
  } catch (error) {
    await supabase.from('upload_batch_rollups').delete().eq('batch_id', batchId);
    throw error;
  }
}

export async function getActiveUploadBatches(
  supabase: SupabaseClient,
  projectIds: string[] | null
): Promise<ActiveUploadBatch[]> {
  if (projectIds?.length === 0) return [];

  let activeQuery = supabase
    .from('files')
    .select('id, metadata, project_id')
    .in('status', ['pending', 'processing']);

  if (projectIds) {
    activeQuery = activeQuery.in('project_id', projectIds);
  }

  const { data: activeRows } = await activeQuery;
  const activeBatchIds = new Set<string>();

  for (const row of activeRows ?? []) {
    const { batchId, batchTotal } = getUploadBatchInfo(
      (row.metadata as Record<string, unknown> | null) ?? {}
    );
    if (batchId && batchTotal > 1) {
      activeBatchIds.add(batchId);
    }
  }

  if (activeBatchIds.size === 0) return [];

  const { data: rollups } = await supabase
    .from('upload_batch_rollups')
    .select('batch_id')
    .in('batch_id', [...activeBatchIds]);

  const finalized = new Set((rollups ?? []).map((row) => row.batch_id));
  const batches: ActiveUploadBatch[] = [];

  for (const batchId of activeBatchIds) {
    if (finalized.has(batchId)) continue;

    const { data: batchRows } = await supabase
      .from('files')
      .select('id, file_name, status, metadata, project_id, projects(client_name, project_name)')
      .contains('metadata', { [UPLOAD_BATCH_ID_KEY]: batchId });

    const files = (batchRows ?? []) as unknown as Array<{
      id: string;
      file_name: string;
      status: string;
      metadata: Record<string, unknown> | null;
      project_id: string;
      projects: unknown;
    }>;

    if (!files.some((file) => file.status === 'pending' || file.status === 'processing')) {
      continue;
    }

    const { batchTotal } = getUploadBatchInfo(files[0]?.metadata ?? {});
    const project = asProjectRef(files[0]?.projects);
    const done = files.filter((file) => TERMINAL_STATUSES.has(file.status)).length;
    const processing = files.filter(
      (file) => file.status === 'pending' || file.status === 'processing'
    ).length;

    batches.push({
      batchId,
      projectId: files[0]?.project_id ?? '',
      projectName: project?.project_name ?? 'Project',
      clientName: project?.client_name ?? 'Client',
      fileNames: files.map((file) => file.file_name),
      total: batchTotal,
      done,
      processing,
    });
  }

  return batches.sort((a, b) => b.processing - a.processing || b.total - a.total);
}
