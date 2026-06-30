'use client';

import { Button } from '@/components/ui/Button';
import { X } from 'lucide-react';

export function TourContinueBanner({
  onContinue,
  onDismiss,
}: {
  onContinue: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="fixed bottom-4 left-1/2 z-[90] w-[min(100%,28rem)] -translate-x-1/2 px-4">
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-lg dark:border-amber-900 dark:bg-amber-950/40">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-amber-950 dark:text-amber-100">Continue your tour</p>
          <p className="mt-0.5 text-xs text-amber-900 dark:text-amber-200">
            You have a project — part two covers files, replace tips, and generating briefs.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button size="sm" onClick={onContinue}>
            Continue
          </Button>
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-lg p-1 text-amber-800 hover:bg-amber-100 dark:text-amber-200 dark:hover:bg-amber-900/40"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
