'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { deleteProject } from '@/lib/actions/projects';
import { Button } from '@/components/ui/Button';
import { DeleteProjectDialog } from '@/components/project/DeleteProjectDialog';

export function DeleteProjectButton({
  projectId,
  projectName,
  clientName,
  iconOnly = false,
}: {
  projectId: string;
  projectName: string;
  clientName: string;
  iconOnly?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function openDialog() {
    setConfirmText('');
    setError('');
    setOpen(true);
  }

  function closeDialog() {
    if (busy) return;
    setOpen(false);
    setConfirmText('');
    setError('');
  }

  async function handleConfirm() {
    if (confirmText.trim().toLowerCase() !== 'delete') return;

    setBusy(true);
    setError('');
    try {
      const result = await deleteProject(projectId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.push('/projects');
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {iconOnly ? (
        <button
          type="button"
          disabled={busy}
          onClick={openDialog}
          aria-label={busy ? 'Deleting project…' : `Delete ${projectName}`}
          title="Delete project"
          className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-950/30 dark:hover:text-red-400"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ) : (
        <Button
          variant="secondary"
          size="sm"
          disabled={busy}
          onClick={openDialog}
          className="text-red-600 hover:border-red-200 hover:bg-red-50 dark:hover:border-red-900 dark:hover:bg-red-950/30"
        >
          <Trash2 className="w-4 h-4" />
          Delete project
        </Button>
      )}

      <DeleteProjectDialog
        open={open}
        projectName={projectName}
        clientName={clientName}
        confirmText={confirmText}
        onConfirmTextChange={setConfirmText}
        loading={busy}
        error={error}
        onConfirm={handleConfirm}
        onCancel={closeDialog}
      />
    </>
  );
}
