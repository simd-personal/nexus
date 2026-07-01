'use client';

import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

type InfoTooltipProps = {
  label: string;
  children: React.ReactNode;
  className?: string;
};

export function InfoTooltip({ label, children, className }: InfoTooltipProps) {
  return (
    <span className={cn('group relative inline-flex align-middle', className)}>
      <button
        type="button"
        className="rounded-full p-0.5 text-gray-400 transition-colors hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 dark:text-gray-500 dark:hover:text-gray-300"
        aria-label={label}
      >
        <Info className="h-4 w-4" aria-hidden />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-72 max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-left text-xs leading-relaxed text-gray-600 opacity-0 shadow-lg transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100 dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-stone)] dark:text-gray-300"
      >
        {children}
      </span>
    </span>
  );
}
