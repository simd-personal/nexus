'use client';

import { Button } from '@/components/ui/Button';
import type { UploadCollisionPrompt } from '@/lib/upload/collisions';

type UploadNameCollisionDialogProps = {
  collision: UploadCollisionPrompt;
  busy?: boolean;
  onReplace: () => void;
  onAddCopy: () => void;
  onCancel: () => void;
};

export function UploadNameCollisionDialog({
  collision,
  busy,
  onReplace,
  onAddCopy,
  onCancel,
}: UploadNameCollisionDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4">
      <div
        className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl dark:bg-[var(--ud-mist)]"
        role="dialog"
        aria-labelledby="upload-collision-title"
      >
        <h3 id="upload-collision-title" className="text-base font-semibold text-gray-900 dark:text-gray-100">
          File already in this project
        </h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          <span className="font-medium text-gray-900 dark:text-gray-100">{collision.file.name}</span>{' '}
          matches an existing file. Replace it to refresh Sunny&apos;s project memory, or add a separate copy.
        </p>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Existing file: {collision.existing.file_name}
        </p>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onCancel} disabled={busy}>
            Cancel upload
          </Button>
          <Button variant="secondary" onClick={onAddCopy} disabled={busy}>
            Add separate copy
          </Button>
          <Button onClick={onReplace} loading={busy}>
            Replace existing
          </Button>
        </div>
      </div>
    </div>
  );
}
