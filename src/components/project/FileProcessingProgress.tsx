'use client';

import { getFileProcessingProgress } from '@/lib/processing/progress';
import { cn } from '@/lib/utils';
import type { FileRecord } from '@/types/database';

export function FileProcessingProgress({ file }: { file: FileRecord }) {
  if (file.status !== 'processing' && file.status !== 'pending') {
    return null;
  }

  const progress = getFileProcessingProgress(file.metadata);
  const percent = progress?.percent ?? (file.status === 'pending' ? 0 : 5);
  const label = progress?.label ?? 'Waiting to start…';
  const isLarge = Boolean(file.metadata?.is_large_file);
  const detail =
    progress?.chunks_total != null && progress.chunks_done != null
      ? `${progress.chunks_done} of ${progress.chunks_total} sections indexed${isLarge ? ' · large file' : ''}`
      : progress?.detail ?? (isLarge ? 'Large file. Indexing may take several minutes' : undefined);

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-medium text-amber-800 dark:text-amber-300">{label}</span>
        <span className="tabular-nums text-gray-500 dark:text-gray-400">{percent}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-amber-100 dark:bg-amber-950/40">
        <div
          className={cn(
            'h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-500 ease-out'
          )}
          style={{ width: `${Math.max(percent, 4)}%` }}
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label}
        />
      </div>
      {detail && <p className="text-xs text-gray-500 dark:text-gray-400">{detail}</p>}
    </div>
  );
}
