'use client';

import { useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  DASHBOARD_PORTFOLIO_SCOPES,
  dashboardScopeLabel,
  type DashboardPortfolioScope,
} from '@/lib/projects/portfolio';
import { setDashboardPortfolio } from '@/lib/actions/projects';

interface PortfolioScopeBarProps {
  scope: DashboardPortfolioScope;
  className?: string;
}

export function PortfolioScopeBar({ scope, className }: PortfolioScopeBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function selectScope(next: DashboardPortfolioScope) {
    if (next === scope) return;

    startTransition(async () => {
      await setDashboardPortfolio(next);

      const params = new URLSearchParams(searchParams.toString());
      if (next === 'work') {
        params.delete('portfolio');
      } else {
        params.set('portfolio', next);
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
      router.refresh();
    });
  }

  return (
    <div
      className={cn(
        'inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1 dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-stone)]',
        pending && 'opacity-70',
        className
      )}
      role="tablist"
      aria-label="Portfolio scope"
    >
      {DASHBOARD_PORTFOLIO_SCOPES.map((option) => {
        const active = scope === option;
        return (
          <button
            key={option}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={pending}
            onClick={() => selectScope(option)}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              active
                ? 'bg-white text-gray-900 shadow-sm dark:bg-[var(--ud-mist)] dark:text-gray-100'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
            )}
          >
            {dashboardScopeLabel(option)}
          </button>
        );
      })}
    </div>
  );
}
