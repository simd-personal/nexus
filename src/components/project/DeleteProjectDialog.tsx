'use client';

import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const CONFIRM_PHRASE = 'delete';

export function DeleteProjectDialog({
  open,
  projectName,
  clientName,
  confirmText,
  onConfirmTextChange,
  loading = false,
  error,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  projectName: string;
  clientName: string;
  confirmText: string;
  onConfirmTextChange: (value: string) => void;
  loading?: boolean;
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  const projectLabel = `${clientName} · ${projectName}`;
  const canConfirm = confirmText.trim().toLowerCase() === CONFIRM_PHRASE;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-sm">
      <div
        className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 shadow-xl dark:border-red-900/50 dark:bg-[var(--ud-mist)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-project-dialog-title"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400">
            <Trash2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 id="delete-project-dialog-title" className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Delete this project?
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              <span className="font-medium text-gray-900 dark:text-gray-100">{projectLabel}</span>{' '}
              and everything in it — files, chats, and indexed content — will be permanently removed.
              This cannot be undone.
            </p>
          </div>
        </div>

        <label className="mt-5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Type <span className="font-mono text-red-600 dark:text-red-400">{CONFIRM_PHRASE}</span> to confirm
          <input
            type="text"
            value={confirmText}
            onChange={(event) => onConfirmTextChange(event.target.value)}
            autoComplete="off"
            autoFocus
            placeholder={CONFIRM_PHRASE}
            className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100 dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-stone)] dark:text-gray-100 dark:focus:border-red-800 dark:focus:ring-red-950/40"
          />
        </label>

        {error && (
          <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading} disabled={!canConfirm || loading}>
            Delete project
          </Button>
        </div>
      </div>
    </div>
  );
}
