import type { SupabaseClient } from '@supabase/supabase-js';

export type ProcessingStage =
  | 'queued'
  | 'extracting'
  | 'chunking'
  | 'embedding'
  | 'analyzing'
  | 'finishing'
  | 'complete'
  | 'failed';

export interface FileProcessingProgress {
  stage: ProcessingStage;
  percent: number;
  label: string;
  detail?: string;
  chunks_done?: number;
  chunks_total?: number;
  updated_at: string;
}

/** No progress heartbeat for this long → treat as stalled and allow retry. */
const STALE_PROCESSING_MS = 60_000;

/** Pending uploads get a process kick after this delay if still not running. */
const PENDING_KICK_MS = 8_000;

export function getFileProcessingProgress(
  metadata: Record<string, unknown> | null | undefined
): FileProcessingProgress | null {
  const progress = metadata?.processing_progress;
  if (!progress || typeof progress !== 'object') return null;
  const p = progress as FileProcessingProgress;
  if (!p.stage || typeof p.percent !== 'number') return null;
  return p;
}

function progressAgeMs(metadata: Record<string, unknown> | null | undefined): number | null {
  const progress = getFileProcessingProgress(metadata);
  if (!progress?.updated_at) return null;
  return Date.now() - new Date(progress.updated_at).getTime();
}

export function isProcessingStale(
  status: string,
  metadata: Record<string, unknown> | null | undefined
): boolean {
  if (status !== 'processing') return false;
  const age = progressAgeMs(metadata);
  if (age === null) return true;
  return age >= STALE_PROCESSING_MS;
}

export function isProcessingActive(
  status: string,
  metadata: Record<string, unknown> | null | undefined
): boolean {
  if (status !== 'processing') return false;
  if (isProcessingStale(status, metadata)) return false;
  const age = progressAgeMs(metadata);
  if (age === null) return false;
  return age < STALE_PROCESSING_MS;
}

export function needsProcessingKick(file: {
  status: string;
  metadata?: Record<string, unknown> | null;
  created_at?: string;
}): boolean {
  if (file.status === 'pending') {
    const progress = getFileProcessingProgress(file.metadata ?? undefined);
    const anchor = progress?.updated_at ?? file.created_at;
    if (!anchor) return true;
    return Date.now() - new Date(anchor).getTime() >= PENDING_KICK_MS;
  }

  if (file.status === 'processing') {
    return isProcessingStale(file.status, file.metadata ?? undefined);
  }

  return false;
}

export async function updateFileProgress(
  supabase: SupabaseClient,
  fileId: string,
  progress: Omit<FileProcessingProgress, 'updated_at'>,
  existingMetadata: Record<string, unknown> = {}
): Promise<void> {
  const processing_progress: FileProcessingProgress = {
    ...progress,
    percent: Math.max(0, Math.min(100, Math.round(progress.percent))),
    updated_at: new Date().toISOString(),
  };

  await supabase
    .from('files')
    .update({
      metadata: {
        ...existingMetadata,
        processing_progress,
        processing_lock: null,
      },
    })
    .eq('id', fileId);
}

export function embeddingPercent(done: number, total: number): number {
  if (total <= 0) return 20;
  return 20 + Math.round((done / total) * 55);
}
