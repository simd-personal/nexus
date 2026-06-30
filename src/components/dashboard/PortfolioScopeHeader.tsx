import { Suspense } from 'react';
import { PortfolioScopeBar } from '@/components/dashboard/PortfolioScopeBar';
import { dashboardScopeLabel, type DashboardPortfolioScope } from '@/lib/projects/portfolio';

export function PortfolioScopeHeader({
  scope,
  description,
}: {
  scope: DashboardPortfolioScope;
  description?: string;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {dashboardScopeLabel(scope)}
        </p>
        {description && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
        )}
      </div>
      <Suspense fallback={null}>
        <PortfolioScopeBar scope={scope} />
      </Suspense>
    </div>
  );
}
