'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CriticalItemsList } from '@/components/critical/CriticalItemCard';
import { ActionItemsList } from '@/components/actions/ActionItemCard';
import type { ActionItemWithProject } from '@/components/actions/ActionItemCard';
import { dashboardInsetPanelClassName, dashboardPanelClassName } from '@/components/dashboard/dashboard-panel-styles';
import type { CriticalItem } from '@/types/database';

type DashboardAttentionPanelProps = {
  criticalItems: CriticalItem[];
  actionItems: ActionItemWithProject[];
  criticalTotal: number;
  actionTotal: number;
};

export function DashboardAttentionPanel({
  criticalItems: initialCriticalItems,
  actionItems: initialActionItems,
  criticalTotal: initialCriticalTotal,
  actionTotal: initialActionTotal,
}: DashboardAttentionPanelProps) {
  const router = useRouter();
  const [criticalItems, setCriticalItems] = useState(initialCriticalItems);
  const [actionItems, setActionItems] = useState(initialActionItems);
  const [criticalTotal, setCriticalTotal] = useState(initialCriticalTotal);
  const [actionTotal, setActionTotal] = useState(initialActionTotal);
  const [loadingMoreActions, setLoadingMoreActions] = useState(false);

  useEffect(() => {
    setCriticalItems(initialCriticalItems);
  }, [initialCriticalItems]);

  useEffect(() => {
    setActionItems(initialActionItems);
    setLoadingMoreActions(false);
  }, [initialActionItems]);

  useEffect(() => {
    setCriticalTotal(initialCriticalTotal);
  }, [initialCriticalTotal]);

  useEffect(() => {
    setActionTotal(initialActionTotal);
  }, [initialActionTotal]);

  const syncDashboard = useCallback(() => {
    router.refresh();
  }, [router]);

  const handleCriticalCountChange = useCallback(
    (delta: number) => {
      setCriticalTotal((current) => Math.max(0, current + delta));
      syncDashboard();
    },
    [syncDashboard]
  );

  const handleActionCountChange = useCallback(
    (delta: number) => {
      setActionTotal((current) => Math.max(0, current + delta));
      syncDashboard();
    },
    [syncDashboard]
  );

  const handleActionListEmpty = useCallback(() => {
    setActionTotal((current) => {
      if (current > 0) setLoadingMoreActions(true);
      return current;
    });
    syncDashboard();
  }, [syncDashboard]);

  const handleCriticalListEmpty = useCallback(() => {
    syncDashboard();
  }, [syncDashboard]);

  const hasCritical = criticalTotal > 0;
  const hasActions = actionTotal > 0;
  const showBoth = hasCritical && hasActions;
  const PanelIcon = hasCritical && !hasActions ? AlertTriangle : CheckSquare;

  if (!hasCritical && !hasActions) {
    return (
      <Card className={`h-full w-full ${dashboardPanelClassName}`}>
        <div className="flex h-full flex-col items-center justify-center py-6 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/80 shadow-sm dark:bg-[var(--ud-mist)]/80">
            <CheckSquare className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-base font-semibold text-gray-900 dark:text-gray-100">You&apos;re caught up</p>
          <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">
            No critical findings or open actions assigned to you. Sunny is monitoring your projects.
          </p>
        </div>
      </Card>
    );
  }

  const subtitle = showBoth
    ? 'Critical findings first, then your follow-ups.'
    : hasCritical
      ? `${criticalTotal} open ${criticalTotal === 1 ? 'issue' : 'issues'} Sunny flagged across projects.`
      : `${actionTotal} open ${actionTotal === 1 ? 'follow-up' : 'follow-ups'} across your projects.`;

  return (
    <Card className={`flex h-full w-full flex-col ${dashboardPanelClassName}`}>
      <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/80 shadow-sm dark:bg-[var(--ud-mist)]/80">
          <PanelIcon
            className={`h-6 w-6 ${hasCritical ? 'text-red-600 dark:text-red-400' : 'text-[var(--brand-accent)]'}`}
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <h3 className="text-base font-semibold leading-snug text-gray-900 dark:text-gray-100">
            Needs your attention
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>

          <div className="mt-4 space-y-4">
            {hasCritical && (
              <section>
                {showBoth && (
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Critical items
                  </p>
                )}
                <div className={dashboardInsetPanelClassName}>
                  <div className="p-4 sm:p-5">
                    <CriticalItemsList
                      items={criticalItems}
                      showProject
                      syncOnUpdate={false}
                      onCountChange={handleCriticalCountChange}
                      onListEmpty={handleCriticalListEmpty}
                    />
                  </div>
                  {criticalTotal > criticalItems.length && (
                    <div className="border-t border-gray-100 px-4 py-2.5 dark:border-[var(--ud-cloud)] sm:px-5">
                      <Link
                        href="/critical-items"
                        className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        View all {criticalTotal} critical items
                      </Link>
                    </div>
                  )}
                </div>
              </section>
            )}

            {hasActions && (
              <section>
                {showBoth && (
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Your action items
                  </p>
                )}
                {loadingMoreActions && actionItems.length === 0 ? (
                  <div className={dashboardInsetPanelClassName}>
                    <p className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400 sm:px-5">
                      Loading your next items…
                    </p>
                  </div>
                ) : (
                  <ActionItemsList
                    items={actionItems}
                    showProject
                    block
                    inset
                    previewCount={2}
                    totalCount={actionTotal}
                    syncOnUpdate={false}
                    onCountChange={handleActionCountChange}
                    onListEmpty={handleActionListEmpty}
                    emptyMessage=""
                  />
                )}
              </section>
            )}
          </div>

          {hasActions && (
            <Link href="/action-items" className="mt-4 inline-block">
              <Button size="sm" className="w-full sm:w-auto">
                View all action items{actionTotal > 0 ? ` (${actionTotal})` : ''}
              </Button>
            </Link>
          )}
          {hasCritical && !hasActions && criticalTotal > 0 && (
            <Link href="/critical-items" className="mt-4 inline-block">
              <Button size="sm" className="w-full sm:w-auto">
                View all critical items
              </Button>
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
}
