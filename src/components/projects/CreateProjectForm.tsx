'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createProject } from '@/lib/actions/projects';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Plus } from 'lucide-react';
import { AI_EMPLOYEE_NAME } from '@/lib/constants';

const INPUT_CLASS =
  'w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-stone)] dark:text-gray-100 dark:focus:ring-gray-600';

export interface ParentProjectOption {
  id: string;
  client_name: string;
  project_name: string;
}

export interface ProgramOption {
  id: string;
  client_name: string;
  project_name: string;
}

export function CreateProjectForm({
  programOptions = [],
  parentProject,
  variant = 'default',
}: {
  programOptions?: ProgramOption[];
  parentProject?: ParentProjectOption;
  variant?: 'default' | 'compact';
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedParentId, setSelectedParentId] = useState(parentProject?.id ?? '');
  const router = useRouter();

  const lockedParent = parentProject ?? null;
  const activeParent =
    lockedParent ??
    programOptions.find((option) => option.id === selectedParentId) ??
    null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    if (lockedParent) {
      formData.set('parent_project_id', lockedParent.id);
      formData.set('client_name', lockedParent.client_name);
    } else if (selectedParentId) {
      const parent = programOptions.find((option) => option.id === selectedParentId);
      if (parent) {
        formData.set('parent_project_id', parent.id);
        if (!formData.get('client_name')) {
          formData.set('client_name', parent.client_name);
        }
      }
    }

    const result = await createProject(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else if (result.data) {
      router.push(`/projects/${result.data.id}/overview`);
      router.refresh();
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} size={variant === 'compact' ? 'sm' : 'md'}>
        <Plus className="h-4 w-4" />
        {lockedParent ? 'Add workstream' : 'New Project'}
      </Button>
    );
  }

  const title = lockedParent
    ? `Add workstream · ${lockedParent.project_name}`
    : 'Create New Project';
  const description = lockedParent
    ? `A parallel track under ${lockedParent.client_name} — separate files and forwarding address.`
    : `${AI_EMPLOYEE_NAME} uses Claude to adapt the project setup to what you describe.`;

  const form = (
    <form onSubmit={handleSubmit} className="space-y-4">
      {lockedParent && <input type="hidden" name="parent_project_id" value={lockedParent.id} />}

      {!lockedParent && programOptions.length > 0 && (
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Program (optional)
          </label>
          <select
            value={selectedParentId}
            onChange={(e) => setSelectedParentId(e.target.value)}
            className={INPUT_CLASS}
          >
            <option value="">Top-level project</option>
            {programOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.client_name} · {option.project_name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Choose a program to create a workstream, or leave blank for a standalone project.
          </p>
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Client Name</label>
        <input
          name="client_name"
          required
          defaultValue={activeParent?.client_name ?? ''}
          readOnly={Boolean(activeParent)}
          placeholder="e.g. Adventist Health"
          className={`${INPUT_CLASS}${activeParent ? ' bg-gray-50 dark:bg-[var(--ud-mist)]' : ''}`}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {lockedParent || selectedParentId ? 'Workstream name' : 'Project Name'}
        </label>
        <input
          name="project_name"
          required
          placeholder={lockedParent ? 'e.g. Site A rollout' : 'e.g. Epic Transformation'}
          className={INPUT_CLASS}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Description (optional)</label>
        <textarea
          name="description"
          rows={2}
          placeholder="Brief project description..."
          className={`${INPUT_CLASS} resize-none`}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Tell {AI_EMPLOYEE_NAME} about this project (optional)
        </label>
        <textarea
          name="sunny_notes"
          rows={3}
          placeholder="e.g. Q3 board review, focus on staffing risks and rollout timeline..."
          className={`${INPUT_CLASS} resize-none`}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" loading={loading} size={variant === 'compact' ? 'sm' : 'md'}>
          {lockedParent || selectedParentId ? 'Create workstream' : 'Create Project'}
        </Button>
        {(variant !== 'compact' || lockedParent) && (
          <Button
            variant="ghost"
            type="button"
            size={variant === 'compact' ? 'sm' : 'md'}
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );

  if (variant === 'compact') {
    return (
      <div>
        {!open ? (
          <Button onClick={() => setOpen(true)} size="sm">
            <Plus className="h-4 w-4" />
            Add workstream
          </Button>
        ) : (
          <div className="rounded-lg border border-gray-200 p-4 dark:border-[var(--ud-cloud)]">{form}</div>
        )}
      </div>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader title={title} description={description} />
      {form}
    </Card>
  );
}
