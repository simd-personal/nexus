'use client';

import { useActionState } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { updateProjectPortfolio, type SettingsFormState } from '@/lib/actions/projects';
import {
  PROJECT_PORTFOLIOS,
  projectPortfolioLabel,
  type ProjectPortfolio,
} from '@/lib/projects/portfolio';

const INITIAL_STATE: SettingsFormState = { status: 'idle', message: '' };

interface ProjectPortfolioPanelProps {
  projectId: string;
  portfolio: ProjectPortfolio;
  isSubProject: boolean;
}

export function ProjectPortfolioPanel({
  projectId,
  portfolio,
  isSubProject,
}: ProjectPortfolioPanelProps) {
  const [state, formAction, pending] = useActionState(
    updateProjectPortfolio.bind(null, projectId),
    INITIAL_STATE
  );

  if (isSubProject) {
    return (
      <Card>
        <CardHeader
          title="Portfolio"
          description={`This workstream uses the ${projectPortfolioLabel(portfolio).toLowerCase()} portfolio from its parent program.`}
        />
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Portfolio"
        description="Work and personal projects stay separate on your dashboard. Sub-workstreams inherit this setting."
      />
      <form action={formAction} className="space-y-4">
        <fieldset className="space-y-2">
          <legend className="sr-only">Project portfolio</legend>
          {PROJECT_PORTFOLIOS.map((option) => (
            <label
              key={option}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 text-sm dark:border-[var(--ud-cloud)]"
            >
              <input
                type="radio"
                name="portfolio"
                value={option}
                defaultChecked={portfolio === option}
                className="h-4 w-4"
              />
              <span className="text-gray-800 dark:text-gray-200">{projectPortfolioLabel(option)}</span>
            </label>
          ))}
        </fieldset>
        <div className="flex items-center gap-3">
          <Button type="submit" size="sm" loading={pending}>
            {pending ? 'Saving…' : 'Save portfolio'}
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
