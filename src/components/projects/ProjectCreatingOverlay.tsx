'use client';

import { AI_EMPLOYEE_NAME } from '@/lib/constants';

export function ProjectCreatingOverlay({ portfolio }: { portfolio?: 'work' | 'personal' }) {
  const subtitle =
    portfolio === 'personal'
      ? `${AI_EMPLOYEE_NAME} will summarize once you add personal files or notes.`
      : `${AI_EMPLOYEE_NAME} will summarize once you upload project materials.`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--ud-cream)]/80 backdrop-blur-sm dark:bg-[var(--ud-mist)]/80"
      role="status"
      aria-live="polite"
      aria-label="Creating project"
    >
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-gray-200/80 bg-white/90 px-8 py-7 shadow-lg dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-stone)]/90">
        <span className="relative flex h-10 w-10 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-[var(--brand-accent)]/15" />
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-[var(--brand-accent)] dark:border-[var(--ud-cloud)] dark:border-t-[var(--brand-accent)]" />
        </span>
        <div className="text-center">
          <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Creating your project…</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}
