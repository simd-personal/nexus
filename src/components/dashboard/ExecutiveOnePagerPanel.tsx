'use client';

import { useMemo, useState } from 'react';
import { FileText, Sparkles } from 'lucide-react';
import { SunnyAvatar } from '@/components/brand/SunnyAvatar';
import { Button } from '@/components/ui/Button';
import { dashboardPanelClassName, dashboardInsetPanelClassName } from '@/components/dashboard/dashboard-panel-styles';
import { formatNaturalProse } from '@/lib/ai/generation-prompts';
import { listDashboardProjectOptions } from '@/lib/dashboard/executive-one-pager';
import { dashboardScopeLabel, type DashboardPortfolioScope } from '@/lib/projects/portfolio';
import { AI_EMPLOYEE_NAME } from '@/lib/constants';
import type { ProjectWithStats } from '@/types/database';

type OnePagerResult = {
  project_id: string;
  client_name: string;
  project_name: string;
  title: string;
  content: string;
};

export function ExecutiveOnePagerPanel({
  portfolioScope,
  projects,
}: {
  portfolioScope: DashboardPortfolioScope;
  projects: ProjectWithStats[];
}) {
  const projectOptions = useMemo(() => listDashboardProjectOptions(projects), [projects]);
  const [selection, setSelection] = useState<'all' | string>('all');
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<OnePagerResult[]>([]);

  const scopeLabel = dashboardScopeLabel(portfolioScope).toLowerCase();
  const selectedCount = selection === 'all' ? projectOptions.length : 1;

  async function handleGenerate() {
    if (projectOptions.length === 0) return;

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const res = await fetch('/api/dashboard/executive-one-pager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: selection,
          portfolio: portfolioScope,
          instructions: instructions.trim() || undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Generation failed. Please try again.');
        return;
      }

      setResults(
        (data.data as OnePagerResult[]).map((item) => ({
          ...item,
          content: formatNaturalProse(item.content),
        }))
      );
    } catch {
      setError('Generation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (projectOptions.length === 0) {
    return null;
  }

  return (
    <section className="mb-6 sm:mb-8">
      <div className={`overflow-hidden rounded-2xl border p-5 sm:p-6 ${dashboardPanelClassName}`}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/80 shadow-sm ring-1 ring-[rgba(124,108,240,0.18)] dark:bg-[var(--ud-mist)]/80 dark:ring-[rgba(167,139,250,0.28)]">
                <FileText className="h-5 w-5 text-[var(--brand-accent)]" aria-hidden />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Executive one-pager
                  </h2>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--brand-accent)] ring-1 ring-[rgba(124,108,240,0.18)] dark:bg-[var(--ud-mist)]/80">
                    <Sparkles className="h-3 w-3" aria-hidden />
                    Dashboard
                  </span>
                </div>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                  {AI_EMPLOYEE_NAME} drafts a quick leadership update from each project&apos;s latest
                  materials. Perfect for a morning scan across {scopeLabel} work.
                </p>
              </div>
            </div>

            <div className={`mt-5 grid gap-4 ${dashboardInsetPanelClassName} p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end`}>
              <div>
                <label
                  htmlFor="executive-one-pager-project"
                  className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Project
                </label>
                <select
                  id="executive-one-pager-project"
                  value={selection}
                  onChange={(event) => setSelection(event.target.value as 'all' | string)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]/30 dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-mist)] dark:text-gray-100"
                >
                  <option value="all">
                    All projects in this view ({projectOptions.length})
                  </option>
                  {projectOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                onClick={() => void handleGenerate()}
                loading={loading}
                size="lg"
                className="w-full rounded-xl px-5 shadow-md sm:w-auto"
              >
                <SunnyAvatar size="xs" animate={loading ? 'work' : 'wave'} />
                {loading
                  ? selectedCount > 1
                    ? `Drafting ${selectedCount} one-pagers…`
                    : 'Drafting one-pager…'
                  : selectedCount > 1
                    ? `Generate ${selectedCount} one-pagers`
                    : 'Generate one-pager'}
              </Button>
            </div>

            <div className="mt-4">
              <label
                htmlFor="executive-one-pager-instructions"
                className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Focus (optional)
              </label>
              <textarea
                id="executive-one-pager-instructions"
                value={instructions}
                onChange={(event) => setInstructions(event.target.value)}
                rows={2}
                placeholder="e.g. Emphasize go-live risks, budget shifts, or what changed this week…"
                className="w-full rounded-xl border border-gray-200 bg-white/90 px-4 py-3 text-sm text-gray-900 shadow-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]/30 dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-mist)]/90 dark:text-gray-100"
              />
            </div>

            {error ? (
              <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
            ) : null}
          </div>
        </div>

        {results.length > 0 ? (
          <div className="mt-6 space-y-4">
            {results.map((result) => (
              <article
                key={result.project_id}
                className={`${dashboardInsetPanelClassName} p-4 sm:p-5`}
              >
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      {result.client_name}
                    </p>
                    <h3 className="mt-1 text-base font-semibold text-gray-900 dark:text-gray-100">
                      {result.project_name}
                    </h3>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full shrink-0 sm:w-auto"
                    onClick={() => void navigator.clipboard.writeText(result.content)}
                  >
                    Copy one-pager
                  </Button>
                </div>
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                  {result.content}
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
