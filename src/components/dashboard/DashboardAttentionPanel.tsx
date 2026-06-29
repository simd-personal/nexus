import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { CriticalItemsList } from '@/components/critical/CriticalItemCard';
import { ActionItemsList } from '@/components/actions/ActionItemCard';
import type { ActionItemWithProject } from '@/components/actions/ActionItemCard';
import type { CriticalItem } from '@/types/database';

type DashboardAttentionPanelProps = {
  criticalItems: CriticalItem[];
  actionItems: ActionItemWithProject[];
  criticalTotal: number;
  actionTotal: number;
};

export function DashboardAttentionPanel({
  criticalItems,
  actionItems,
  criticalTotal,
  actionTotal,
}: DashboardAttentionPanelProps) {
  const hasCritical = criticalItems.length > 0;
  const hasActions = actionItems.length > 0;
  const showBoth = hasCritical && hasActions;

  if (!hasCritical && !hasActions) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-5 py-8 text-center dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-mist)]">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">You&apos;re caught up</p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          No critical findings or open actions assigned to you. Sunny is monitoring your projects.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Needs your attention</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {showBoth
            ? 'Critical findings first, then your follow-ups.'
            : hasCritical
              ? 'Issues Sunny flagged that may need a decision.'
              : 'Follow-ups Sunny surfaced for you across projects.'}
        </p>
      </div>

      {hasCritical && (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Critical items
              {criticalTotal > criticalItems.length && (
                <span className="ml-2 font-normal text-gray-400 dark:text-gray-500">
                  showing {criticalItems.length} of {criticalTotal}
                </span>
              )}
            </h3>
            {criticalTotal > 0 && (
              <Link href="/critical-items" className="shrink-0">
                <Button variant="ghost" size="sm">View all</Button>
              </Link>
            )}
          </div>
          <CriticalItemsList items={criticalItems} showProject />
        </section>
      )}

      {hasActions && (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Your action items
              {actionTotal > actionItems.length && (
                <span className="ml-2 font-normal text-gray-400 dark:text-gray-500">
                  showing {actionItems.length} of {actionTotal}
                </span>
              )}
            </h3>
            {actionTotal > 0 && (
              <Link href="/action-items" className="shrink-0">
                <Button variant="ghost" size="sm">View all</Button>
              </Link>
            )}
          </div>
          <ActionItemsList items={actionItems} showProject compact={showBoth} />
        </section>
      )}
    </div>
  );
}
