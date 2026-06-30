'use client';

import {
  getFileProcessingDisplay,
  PROCESSING_BACKGROUND_NOTE,
} from '@/lib/processing/user-messages';
import { cn } from '@/lib/utils';
import type { FileRecord } from '@/types/database';

export function FileProcessingProgress({
  file,
  compact = false,
}: {
  file: FileRecord;
  compact?: boolean;
}) {
  const display = getFileProcessingDisplay(file);

  if (file.status === 'failed' && display) {
    if (compact) {
      return (
        <p className="mt-1 truncate text-xs text-red-600 dark:text-red-400" title={display.detail}>
          {display.headline}
          {display.detail ? ` — ${display.detail}` : ''}
        </p>
      );
    }

    return (
      <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 dark:border-red-900 dark:bg-red-950/30">
        <p className="text-xs font-medium text-red-800 dark:text-red-300">{display.headline}</p>
        {display.detail && (
          <p className="mt-1 text-xs text-red-700 dark:text-red-400">{display.detail}</p>
        )}
        {display.helper && (
          <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{display.helper}</p>
        )}
      </div>
    );
  }

  if (file.status !== 'processing' && file.status !== 'pending') {
    return null;
  }

  if (!display) return null;

  const progress = file.metadata?.processing_progress as { percent?: number } | undefined;
  const percent = progress?.percent ?? (file.status === 'pending' ? 0 : 5);

  if (compact) {
    return (
      <div className="mt-1.5 space-y-1">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="truncate font-medium text-amber-800 dark:text-amber-300">
            {display.headline}
          </span>
          <span className="shrink-0 tabular-nums text-gray-400 dark:text-gray-500">{percent}%</span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-amber-100 dark:bg-amber-950/40">
          <div
            className={cn(
              'h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-500 ease-out'
            )}
            style={{ width: `${Math.max(percent, 4)}%` }}
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={display.headline}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-medium text-amber-800 dark:text-amber-300">{display.headline}</span>
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
          aria-label={display.headline}
        />
      </div>
      {display.detail && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{display.detail}</p>
      )}
      {(display.helper || file.status === 'pending' || file.status === 'processing') && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {display.helper ?? PROCESSING_BACKGROUND_NOTE}
        </p>
      )}
    </div>
  );
}
