'use client';

import { SunnyAvatar } from '@/components/brand/SunnyAvatar';
import { Button } from '@/components/ui/Button';
import type { TourStep } from '@/lib/tour/steps';
import { X } from 'lucide-react';

type TourOverlayProps = {
  step: TourStep;
  targetRect: DOMRect | null;
  progressLabel?: string;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  canGoBack: boolean;
  isLast: boolean;
};

export function TourOverlay({
  step,
  targetRect,
  progressLabel,
  onNext,
  onBack,
  onSkip,
  canGoBack,
  isLast,
}: TourOverlayProps) {
  const padding = 8;
  const highlight = targetRect
    ? {
        top: targetRect.top - padding,
        left: targetRect.left - padding,
        width: targetRect.width + padding * 2,
        height: targetRect.height + padding * 2,
      }
    : null;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      <div className="absolute inset-0 bg-gray-900/55 pointer-events-auto" onClick={onSkip} aria-hidden />

      {highlight && (
        <div
          className="pointer-events-none absolute rounded-xl ring-4 ring-[var(--brand-accent)] shadow-lg"
          style={{
            top: highlight.top,
            left: highlight.left,
            width: highlight.width,
            height: highlight.height,
          }}
        />
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="pointer-events-auto w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-mist)]">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <SunnyAvatar size="sm" />
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  {progressLabel ? `Step ${progressLabel}` : 'Tour'}
                </p>
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{step.title}</h3>
              </div>
            </div>
            <button
              type="button"
              onClick={onSkip}
              className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-[var(--ud-cloud)]"
              aria-label="Skip tour"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="text-sm text-gray-700 dark:text-gray-300">{step.body}</p>
          {step.sunnyQuip && (
            <p className="mt-2 text-sm italic text-gray-500 dark:text-gray-400">{step.sunnyQuip}</p>
          )}

          <div className="mt-5 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onSkip}
              className="text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Skip tour
            </button>
            <div className="flex gap-2">
              {canGoBack && (
                <Button variant="secondary" size="sm" onClick={onBack}>
                  Back
                </Button>
              )}
              <Button size="sm" onClick={onNext}>
                {isLast ? 'Finish' : 'Next'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
