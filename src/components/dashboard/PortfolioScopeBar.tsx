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
      className={cn('flex flex-wrap items-center gap-x-5 gap-y-2', pending && 'opacity-70', className)}
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
              'group inline-flex items-center gap-2.5 rounded-md py-1.5 text-sm transition-colors',
              active
                ? 'font-semibold text-gray-900 dark:text-gray-100'
                : 'font-medium text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100'
            )}
          >
            <span
              aria-hidden
              className={cn(
                'shrink-0 rounded-full transition-all',
                active
                  ? 'h-3 w-3 bg-[var(--brand-accent)] ring-[3px] ring-[rgba(37,99,235,0.18)] dark:ring-[rgba(37,99,235,0.35)]'
                  : 'h-2.5 w-2.5 border-2 border-gray-300 bg-transparent group-hover:border-gray-400 dark:border-[var(--ud-slate)] dark:group-hover:border-gray-400'
              )}
            />
            {dashboardScopeLabel(option)}
          </button>
        );
      })}
    </div>
  );
}
