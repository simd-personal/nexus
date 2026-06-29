'use client';

import { useActionState } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { updateProjectRelevance, type SettingsFormState } from '@/lib/actions/projects';

function joinKeywords(values: string[] | null | undefined): string {
  return (values ?? []).join(', ');
}

const INITIAL_STATE: SettingsFormState = { status: 'idle', message: '' };

interface ProjectRelevancePanelProps {
  projectId: string;
  watchKeywords: string[];
  myRole: string | null;
}

export function ProjectRelevancePanel({
  projectId,
  watchKeywords,
  myRole,
}: ProjectRelevancePanelProps) {
  const [state, formAction, pending] = useActionState(
    updateProjectRelevance.bind(null, projectId),
    INITIAL_STATE
  );

  return (
    <Card>
      <CardHeader
        title="Action item relevance"
        description="Sunny uses these terms to filter transcript noise and surface follow-ups for you."
      />
      <form action={formAction} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Project keywords
          </label>
          <input
            name="watch_keywords"
            defaultValue={joinKeywords(watchKeywords)}
            placeholder="Epic, Conifer, cutover"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-stone)] dark:text-gray-100 dark:focus:ring-gray-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            My role on this project
          </label>
          <input
            name="my_role"
            defaultValue={myRole ?? ''}
            placeholder="Program lead, UpperDeck"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-stone)] dark:text-gray-100 dark:focus:ring-gray-500"
          />
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" size="sm" loading={pending}>
            {pending ? 'Saving…' : 'Save relevance settings'}
          </Button>
          {state.status !== 'idle' && (
            <p
              aria-live="polite"
              className={`text-sm ${state.status === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}
            >
              {state.message}
            </p>
          )}
        </div>
      </form>
    </Card>
  );
}
