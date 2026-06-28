'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { deleteProject } from '@/lib/actions/projects';
import { Button } from '@/components/ui/Button';

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
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    const label = `${clientName} · ${projectName}`;
    const confirmed = window.confirm(
      `Delete "${label}"?\n\nThis permanently removes the project, all uploaded files, chats, and indexed content. This cannot be undone.`
    );
    if (!confirmed) return;

    const typed = window.prompt(`Type "${projectName}" to confirm deletion:`);
    if (typed?.trim() !== projectName) {
      window.alert('Project name did not match. Deletion cancelled.');
      return;
    }

    setBusy(true);
    try {
      const result = await deleteProject(projectId);
      if (result.error) {
        window.alert(result.error);
        return;
      }
      router.push('/projects');
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (iconOnly) {
    return (
      <button
        type="button"
        disabled={busy}
        onClick={handleDelete}
        aria-label={busy ? 'Deleting project…' : `Delete ${projectName}`}
        title="Delete project"
        className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    );
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      disabled={busy}
      onClick={handleDelete}
      className="text-red-600 hover:border-red-200 hover:bg-red-50"
    >
      <Trash2 className="w-4 h-4" />
      {busy ? 'Deleting…' : 'Delete project'}
    </Button>
  );
}
