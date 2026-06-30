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
      params.set('portfolio', next);
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
      router.refresh();
    });
  }

  return (
    <div
      className={cn('flex flex-wrap gap-2', pending && 'opacity-70', className)}
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
              'rounded-full px-4 py-2 text-sm font-medium transition-all',
              active
                ? 'bg-[var(--brand-accent)] text-white shadow-sm ring-2 ring-[rgba(37,99,235,0.2)] dark:ring-[rgba(37,99,235,0.35)]'
                : 'border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-stone)] dark:text-gray-400 dark:hover:border-[var(--ud-slate)] dark:hover:text-gray-100'
            )}
          >
            {dashboardScopeLabel(option)}
          </button>
        );
      })}
    </div>
  );
}
