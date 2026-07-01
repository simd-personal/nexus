'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, FileText, Sparkles } from 'lucide-react';
import { SunnyAvatar } from '@/components/brand/SunnyAvatar';
import { Button } from '@/components/ui/Button';
import { dashboardPanelClassName, dashboardInsetPanelClassName } from '@/components/dashboard/dashboard-panel-styles';
import { formatNaturalProse } from '@/lib/ai/generation-prompts';
import {
  listDashboardProjectOptions,
  type SavedExecutiveOnePager,
} from '@/lib/dashboard/executive-one-pager';
import { dashboardScopeLabel, type DashboardPortfolioScope } from '@/lib/projects/portfolio';
import { formatFileUploadTime } from '@/lib/utils';
import { AI_EMPLOYEE_NAME } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { ProjectWithStats } from '@/types/database';

function normalizeOnePager(item: SavedExecutiveOnePager): SavedExecutiveOnePager {
  return {
    ...item,
    content: formatNaturalProse(item.content),
  };
}

function mergeSavedOnePagers(
  existing: SavedExecutiveOnePager[],
  incoming: SavedExecutiveOnePager[]
): SavedExecutiveOnePager[] {
  const seen = new Set<string>();
  const merged: SavedExecutiveOnePager[] = [];

  for (const item of [...incoming, ...existing]) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    merged.push(item);
  }

  return merged.sort(
    (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)
  );
}

function SavedOnePagerCard({
  item,
  expanded,
  onToggle,
}: {
  item: SavedExecutiveOnePager;
  expanded: boolean;
  onToggle: () => void;
}) {
  const generatedLabel = formatFileUploadTime(item.created_at);

  return (
    <article className={`${dashboardInsetPanelClassName} overflow-hidden`}>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start gap-3 p-4 text-left sm:p-5"
        aria-expanded={expanded}
      >
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {item.client_name}
          </p>
          <h3 className="mt-1 text-base font-semibold text-gray-900 dark:text-gray-100">
            {item.project_name}
          </h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Generated {generatedLabel}
          </p>
        </div>
        <ChevronDown
          className={cn(
            'mt-1 h-4 w-4 shrink-0 text-gray-400 transition-transform',
            expanded && 'rotate-180'
          )}
          aria-hidden
        />
      </button>

      {expanded ? (
        <div className="border-t border-white/80 px-4 pb-4 pt-3 dark:border-[var(--ud-cloud)] sm:px-5 sm:pb-5">
          <div className="mb-3 flex justify-end">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void navigator.clipboard.writeText(item.content)}
            >
              Copy one-pager
            </Button>
          </div>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-300">
            {item.content}
          </div>
        </div>
      ) : null}
    </article>
  );
}

export function ExecutiveOnePagerPanel({
  portfolioScope,
  projects,
  initialSaved = [],
}: {
  portfolioScope: DashboardPortfolioScope;
  projects: ProjectWithStats[];
  initialSaved?: SavedExecutiveOnePager[];
}) {
  const projectOptions = useMemo(() => listDashboardProjectOptions(projects), [projects]);
  const [selection, setSelection] = useState<'all' | string>('all');
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<SavedExecutiveOnePager[]>(() =>
    initialSaved.map(normalizeOnePager)
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const scopeLabel = dashboardScopeLabel(portfolioScope).toLowerCase();
  const selectedCount = selection === 'all' ? projectOptions.length : 1;

  async function handleGenerate() {
    if (projectOptions.length === 0) return;

    setLoading(true);
    setError(null);

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

      const generated = (data.data as SavedExecutiveOnePager[]).map(normalizeOnePager);
      setSaved((prev) => mergeSavedOnePagers(prev, generated));
      setExpandedId(generated[0]?.id ?? null);
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

        {saved.length > 0 ? (
          <div className="mt-6 border-t border-white/70 pt-6 dark:border-[var(--ud-cloud)]/70">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Saved one-pagers
                </h3>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  Recent drafts for this dashboard view, with generation timestamps.
                </p>
              </div>
              <span className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-gray-600 ring-1 ring-gray-200 dark:bg-[var(--ud-mist)]/80 dark:text-gray-300 dark:ring-[var(--ud-cloud)]">
                {saved.length}
              </span>
            </div>
            <div className="space-y-3">
              {saved.map((item) => (
                <SavedOnePagerCard
                  key={item.id}
                  item={item}
                  expanded={expandedId === item.id}
                  onToggle={() =>
                    setExpandedId((current) => (current === item.id ? null : item.id))
                  }
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
