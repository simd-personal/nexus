'use client';

import { useActionState } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  updateDashboardPortfolioPreference,
  type SettingsFormState,
} from '@/lib/actions/projects';
import {
  DASHBOARD_PORTFOLIO_SCOPES,
  dashboardScopeLabel,
  type DashboardPortfolioScope,
} from '@/lib/projects/portfolio';

const INITIAL_STATE: SettingsFormState = { status: 'idle', message: '' };

interface DashboardPortfolioSettingsProps {
  currentScope: DashboardPortfolioScope;
}

export function DashboardPortfolioSettings({ currentScope }: DashboardPortfolioSettingsProps) {
  const [state, formAction, pending] = useActionState(
    updateDashboardPortfolioPreference,
    INITIAL_STATE
  );

  return (
    <form action={formAction} className="space-y-4">
      <fieldset className="space-y-2">
        <legend className="sr-only">Default dashboard scope</legend>
        {DASHBOARD_PORTFOLIO_SCOPES.map((option) => (
          <label
            key={option}
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 text-sm dark:border-[var(--ud-cloud)]"
          >
            <input
              type="radio"
              name="dashboard_portfolio"
              value={option}
              defaultChecked={currentScope === option}
              className="h-4 w-4"
            />
            <span className="text-gray-800 dark:text-gray-200">{dashboardScopeLabel(option)}</span>
          </label>
        ))}
      </fieldset>
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" loading={pending}>
          {pending ? 'Saving…' : 'Save default scope'}
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
  );
}

export function DashboardPortfolioSettingsCard({ currentScope }: DashboardPortfolioSettingsProps) {
  return (
    <Card className="mt-6">
      <CardHeader
        title="Dashboard scope"
        description="Choose which projects appear on your executive dashboard and global lists by default."
      />
      <DashboardPortfolioSettings currentScope={currentScope} />
    </Card>
  );
}
