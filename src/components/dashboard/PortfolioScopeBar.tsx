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
  const activeIndex = DASHBOARD_PORTFOLIO_SCOPES.indexOf(scope);
  const segmentCount = DASHBOARD_PORTFOLIO_SCOPES.length;

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
      className={cn(
        'relative inline-flex rounded-[10px] border border-gray-200 bg-gray-50/80 p-[3px] dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-stone)]',
        pending && 'opacity-70',
        className
      )}
      role="tablist"
      aria-label="Portfolio scope"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute top-[3px] bottom-[3px] left-[3px] rounded-[7px] border border-gray-200/80 bg-white transition-transform duration-200 ease-out dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-mist)]"
        style={{
          width: `calc((100% - 6px) / ${segmentCount})`,
          transform: `translateX(calc(${activeIndex} * 100%))`,
        }}
      />
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
              'relative z-10 min-w-[4.5rem] rounded-[7px] px-3.5 py-1.5 text-sm font-medium transition-colors sm:min-w-[5.5rem]',
              active
                ? 'text-gray-900 dark:text-gray-100'
                : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100'
            )}
          >
            {dashboardScopeLabel(option)}
          </button>
        );
      })}
    </div>
  );
}
