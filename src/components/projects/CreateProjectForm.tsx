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

export function CreateProjectForm() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
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
      <Button onClick={() => setOpen(true)}>
        <Plus className="w-4 h-4" />
        New Project
      </Button>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader
        title="Create New Project"
        description={`${AI_EMPLOYEE_NAME} uses Claude to adapt the project setup to what you describe.`}
      />
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Client Name</label>
          <input
            name="client_name"
            required
            placeholder="e.g. Adventist Health"
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Project Name</label>
          <input
            name="project_name"
            required
            placeholder="e.g. June Site Visit"
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
          <Button type="submit" loading={loading}>Create Project</Button>
          <Button variant="ghost" type="button" onClick={() => setOpen(false)}>Cancel</Button>
        </div>
      </form>
    </Card>
  );
}
