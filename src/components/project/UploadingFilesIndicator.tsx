'use client';

import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

type UploadingFilesIndicatorProps = {
  count: number;
  names: string[];
  variant?: 'banner' | 'overlay' | 'row';
  className?: string;
};

function UploadSpinner({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const dimension = size === 'sm' ? 'h-4 w-4' : 'h-8 w-8';
  return (
    <span className={cn('relative flex shrink-0 items-center justify-center', size === 'sm' ? 'h-5 w-5' : 'h-10 w-10')}>
      <span className="absolute inset-0 animate-ping rounded-full bg-[var(--brand-accent)]/15" />
      <span
        className={cn(
          dimension,
          'animate-spin rounded-full border-2 border-gray-200 border-t-[var(--brand-accent)] dark:border-[var(--ud-cloud)] dark:border-t-[var(--brand-accent)]'
        )}
      />
    </span>
  );
}

function uploadLabel(count: number) {
  return count === 1 ? 'Uploading 1 file…' : `Uploading ${count} files…`;
}

function namePreview(names: string[], max = 3) {
  const shown = names.slice(0, max).join(', ');
  const extra = names.length > max ? ` +${names.length - max} more` : '';
  return `${shown}${extra}`;
}

export function UploadingFilesIndicator({
  count,
  names,
  variant = 'banner',
  className,
}: UploadingFilesIndicatorProps) {
  if (variant === 'row') {
    return (
      <div className={cn('flex items-start gap-3 px-4 py-3', className)}>
        <UploadSpinner size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{names[0] ?? 'File'}</p>
          <p className="text-xs text-[var(--brand-accent)]">Uploading…</p>
        </div>
        <FileText className="mt-0.5 h-4 w-4 shrink-0 text-gray-300 dark:text-gray-600" />
      </div>
    );
  }

  if (variant === 'overlay') {
    return (
      <div
        className={cn(
          'pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-[var(--ud-cream)]/75 backdrop-blur-sm dark:bg-[var(--ud-mist)]/75',
          className
        )}
        role="status"
        aria-live="polite"
        aria-label={uploadLabel(count)}
      >
        <div className="mx-4 flex max-w-sm flex-col items-center gap-4 rounded-2xl border border-gray-200/80 bg-white/95 px-8 py-7 text-center shadow-lg dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-stone)]/95">
          <UploadSpinner />
          <div>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{uploadLabel(count)}</p>
            {names.length > 0 && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{namePreview(names)}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border border-[var(--brand-accent)]/20 bg-[rgba(37,99,235,0.06)] px-4 py-3 dark:border-[var(--brand-accent)]/30 dark:bg-[rgba(37,99,235,0.12)]',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <UploadSpinner size="sm" />
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{uploadLabel(count)}</p>
        {names.length > 0 && (
          <p className="truncate text-xs text-gray-500 dark:text-gray-400">{namePreview(names)}</p>
        )}
      </div>
    </div>
  );
}
