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

const STALE_PROCESSING_MS = 90_000;

export function getFileProcessingProgress(
  metadata: Record<string, unknown> | null | undefined
): FileProcessingProgress | null {
  const progress = metadata?.processing_progress;
  if (!progress || typeof progress !== 'object') return null;
  const p = progress as FileProcessingProgress;
  if (!p.stage || typeof p.percent !== 'number') return null;
  return p;
}

export function isProcessingActive(
  status: string,
  metadata: Record<string, unknown> | null | undefined
): boolean {
  if (status !== 'processing') return false;
  const progress = getFileProcessingProgress(metadata);
  if (!progress?.updated_at) return true;
  return Date.now() - new Date(progress.updated_at).getTime() < STALE_PROCESSING_MS;
}

export function isProcessingStale(
  status: string,
  metadata: Record<string, unknown> | null | undefined
): boolean {
  if (status !== 'processing') return false;
  const progress = getFileProcessingProgress(metadata);
  if (!progress?.updated_at) return true;
  return Date.now() - new Date(progress.updated_at).getTime() >= STALE_PROCESSING_MS;
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
      },
    })
    .eq('id', fileId);
}

export function embeddingPercent(done: number, total: number): number {
  if (total <= 0) return 20;
  return 20 + Math.round((done / total) * 55);
}
