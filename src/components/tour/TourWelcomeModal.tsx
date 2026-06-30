'use client';

import { SunnyAvatar } from '@/components/brand/SunnyAvatar';
import { Button } from '@/components/ui/Button';
import { AI_EMPLOYEE_NAME } from '@/lib/constants';

export function TourWelcomeModal({
  onStart,
  onDismiss,
}: {
  onStart: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/50 p-4">
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-[var(--ud-mist)]"
        role="dialog"
        aria-labelledby="tour-welcome-title"
      >
        <div className="mb-4 flex items-center gap-3">
          <SunnyAvatar size="md" />
          <div>
            <h2 id="tour-welcome-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Want the 2-minute tour?
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{AI_EMPLOYEE_NAME} shows you around</p>
          </div>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Quick walkthrough of projects, uploads, replace-and-diff tips, Ask Sunny, and the stuff people miss on day one.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onDismiss}>
            Skip for now
          </Button>
          <Button onClick={onStart}>Give me a tour</Button>
        </div>
      </div>
    </div>
  );
}
