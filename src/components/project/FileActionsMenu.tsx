'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import type { FileRecord } from '@/types/database';
import { FolderInput, Link2, MoreHorizontal, Pencil, StickyNote, Trash2 } from 'lucide-react';

type ProjectOption = {
  id: string;
  client_name: string;
  project_name: string;
};

type FileActionsMenuProps = {
  file: FileRecord;
  currentProjectId: string;
  busy?: boolean;
  onUpdated: () => void;
};

type DialogMode = 'rename' | 'note' | 'move' | 'share' | 'remove' | null;

export function FileActionsMenu({ file, currentProjectId, busy, onUpdated }: FileActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<DialogMode>(null);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [value, setValue] = useState('');
  const [targetProjectId, setTargetProjectId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-file-actions-root]')) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  useEffect(() => {
    if (mode !== 'move' && mode !== 'share') return;
    void fetch('/api/projects')
      .then((res) => res.json())
      .then((data) => {
        const list = (data.projects ?? []) as ProjectOption[];
        setProjects(list.filter((project) => project.id !== currentProjectId));
      })
      .catch(() => setProjects([]));
  }, [mode, currentProjectId]);

  function startDialog(nextMode: DialogMode) {
    setOpen(false);
    setMode(nextMode);
    setError('');
    setValue(nextMode === 'rename' ? file.file_name : nextMode === 'note' ? file.user_note ?? '' : '');
    setTargetProjectId('');
  }

  async function submit() {
    setSubmitting(true);
    setError('');
    try {
      if (mode === 'rename' || mode === 'note') {
        const res = await fetch(`/api/files/${file.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            mode === 'rename' ? { file_name: value } : { user_note: value || null }
          ),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error ?? 'Update failed');
          return;
        }
      } else if (mode === 'move' || mode === 'share') {
        if (!targetProjectId) {
          setError('Choose a project');
          return;
        }
        const endpoint = mode === 'move' ? 'move' : 'share';
        const res = await fetch(`/api/files/${file.id}/${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ target_project_id: targetProjectId }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error ?? 'Request failed');
          return;
        }
      } else if (mode === 'remove') {
        const res = await fetch(`/api/files/${file.id}/remove`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ project_id: currentProjectId }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error ?? 'Remove failed');
          return;
        }
      }

      setMode(null);
      onUpdated();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative" data-file-actions-root>
      <Button
        variant="secondary"
        size="sm"
        disabled={busy}
        onClick={() => setOpen((current) => !current)}
        aria-label={`File actions for ${file.file_name}`}
      >
        <MoreHorizontal className="h-4 w-4" />
        Actions
      </Button>

      {open && (
        <div className="absolute right-0 z-20 mt-1 w-52 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          <MenuButton icon={Pencil} label="Rename file" onClick={() => startDialog('rename')} />
          <MenuButton icon={StickyNote} label="Add note / context" onClick={() => startDialog('note')} />
          <MenuButton icon={FolderInput} label="Move to project" onClick={() => startDialog('move')} />
          <MenuButton icon={Link2} label="Share with project" onClick={() => startDialog('share')} />
          <MenuButton icon={Trash2} label="Remove from project" onClick={() => startDialog('remove')} danger />
        </div>
      )}

      {mode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <h3 className="text-base font-semibold text-gray-900">
              {mode === 'rename' && 'Rename file'}
              {mode === 'note' && 'Add note or context'}
              {mode === 'move' && 'Move to another project'}
              {mode === 'share' && 'Share with another project'}
              {mode === 'remove' && 'Remove from this project'}
            </h3>
            <p className="mt-1 text-sm text-gray-500 truncate">{file.file_name}</p>

            {(mode === 'rename' || mode === 'note') && (
              mode === 'rename' ? (
                <input
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  className="mt-4 w-full rounded-lg border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                  placeholder="New file name"
                />
              ) : (
                <textarea
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  rows={4}
                  className="mt-4 w-full rounded-lg border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                  placeholder="Optional context for Sunny"
                />
              )
            )}

            {(mode === 'move' || mode === 'share') && (
              <div className="mt-4">
                <label className="text-xs font-medium text-gray-600">Choose project</label>
                <select
                  value={targetProjectId}
                  onChange={(event) => setTargetProjectId(event.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-gray-200 p-2.5 text-sm"
                >
                  <option value="">Select a project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.client_name} · {project.project_name}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-gray-500">
                  {mode === 'move'
                    ? 'Moves the file and keeps source metadata and timeline history.'
                    : 'Creates a linked copy in the other project while keeping the original.'}
                </p>
              </div>
            )}

            {mode === 'remove' && (
              <p className="mt-4 text-sm text-gray-600">
                {file.origin_file_id
                  ? 'This removes the shared copy from this project. The original file stays in its source project.'
                  : 'This removes the file from this project workspace and deletes its indexed content here.'}
              </p>
            )}

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setMode(null)} disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={submit} loading={submitting}>
                {mode === 'remove' ? 'Remove' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuButton({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 ${
        danger ? 'text-red-600' : 'text-gray-700'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
