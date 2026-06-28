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
}: {
  projectId: string;
  projectName: string;
  clientName: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    const label = `${clientName} — ${projectName}`;
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
