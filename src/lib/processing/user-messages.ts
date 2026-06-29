import { getFileProcessingProgress, type ProcessingStage } from '@/lib/processing/progress';
import type { FileRecord } from '@/types/database';

export const FILE_STATUS_LABELS: Record<string, string> = {
  pending: 'Queued',
  processing: 'Indexing',
  processed: 'Ready for search',
  failed: 'Failed',
  uploaded_unprocessed: 'Stored only',
};

const STAGE_HELPERS: Partial<Record<ProcessingStage, string>> = {
  queued:
    'Sunny will start shortly. You can leave this page — stuck jobs are retried automatically every few minutes.',
  extracting: 'Reading your file and pulling out text…',
  chunking: 'Organizing content into searchable sections…',
  embedding:
    'Building your search index. Very large files may pause and resume automatically in the background.',
  analyzing: 'Sunny is summarizing and scanning for action items…',
  finishing: 'Saving your Sunny update…',
  complete: 'Done — you can search and chat with this file now.',
};

export const PROCESSING_BACKGROUND_NOTE =
  'Processing runs in the background. You can keep using UpperDeck while Sunny works.';

export const PROCESSING_FAILED_ACTION =
  'Tap Reprocess to try again, or delete and re-upload the file.';

export function fileStatusLabel(status: string): string {
  return FILE_STATUS_LABELS[status] ?? status.replace(/_/g, ' ');
}

export function getStageHelperText(
  stage?: ProcessingStage,
  options?: { label?: string; isLarge?: boolean }
): string | null {
  const label = options?.label ?? '';
  if (
    label.includes('Continuing indexing') ||
    label.includes('Resuming') ||
    (stage === 'embedding' && options?.isLarge)
  ) {
    return 'Large file — Sunny continues in the background. No action needed.';
  }
  if (!stage) return null;
  return STAGE_HELPERS[stage] ?? null;
}

export interface FileProcessingDisplay {
  headline: string;
  detail?: string;
  helper?: string;
}

export function getFileProcessingDisplay(
  file: Pick<FileRecord, 'status' | 'metadata'>
): FileProcessingDisplay | null {
  if (file.status === 'failed') {
    const progress = getFileProcessingProgress(file.metadata);
    const metadata = file.metadata ?? {};
    const errorDetail =
      (typeof metadata.error === 'string' && metadata.error) ||
      progress?.detail ||
      'Something went wrong while reading this file.';

    return {
      headline: progress?.label ?? 'Processing failed',
      detail: errorDetail,
      helper: PROCESSING_FAILED_ACTION,
    };
  }

  if (file.status !== 'pending' && file.status !== 'processing') {
    return null;
  }

  const progress = getFileProcessingProgress(file.metadata);
  const isLarge = Boolean(file.metadata?.is_large_file);
  const sizeHint =
    typeof file.metadata?.size_hint === 'string' ? file.metadata.size_hint : null;
  const sizeTier = file.metadata?.size_tier as string | undefined;

  const headline =
    progress?.label ??
    (file.status === 'pending' ? 'Queued for processing…' : 'Starting processing…');

  let detail: string | undefined;
  if (progress?.chunks_total != null && progress.chunks_done != null) {
    detail = `${progress.chunks_done} of ${progress.chunks_total} sections indexed`;
    if (isLarge) detail += ' · large file';
  } else if (progress?.detail) {
    detail = progress.detail;
  } else if (sizeHint) {
    detail = sizeHint;
  } else if (sizeTier === 'large' || sizeTier === 'very_large') {
    detail = 'Large upload — indexing may take several minutes.';
  }

  const helper =
    getStageHelperText(progress?.stage, { label: headline, isLarge }) ??
    (file.status === 'pending' ? STAGE_HELPERS.queued : undefined);

  return { headline, detail, helper };
}

export function onboardingProcessingSubtitle(fileCount: number): string {
  if (fileCount > 1) {
    return 'Large batches can take several minutes. Sunny keeps working in the background — continue whenever you are ready.';
  }
  return 'Extracting text, indexing for search, and drafting your first brief…';
}
