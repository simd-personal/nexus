import type { DashboardUpdatesFeed } from '@/lib/data/queries';
import type { DashboardPortfolioScope } from '@/lib/projects/portfolio';

export function buildDashboardUpdatesFeedUrl(
  portfolioScope: DashboardPortfolioScope,
  limit = 5
): string {
  const params = new URLSearchParams({
    portfolio: portfolioScope,
    limit: String(limit),
  });
  return `/api/dashboard/updates?${params.toString()}`;
}

export async function fetchDashboardUpdatesFeed(
  portfolioScope: DashboardPortfolioScope,
  limit = 5
): Promise<DashboardUpdatesFeed | null> {
  const response = await fetch(buildDashboardUpdatesFeedUrl(portfolioScope, limit), {
    cache: 'no-store',
  });
  if (!response.ok) return null;
  return (await response.json()) as DashboardUpdatesFeed;
}

export function dashboardUpdatesFeedChanged(
  previous: Pick<DashboardUpdatesFeed, 'updates' | 'indexingActive'>,
  next: Pick<DashboardUpdatesFeed, 'updates' | 'indexingActive'>
): { hasNewUpdates: boolean; indexingFinished: boolean } {
  const previousIds = new Set(previous.updates.map((update) => update.id));
  const hasNewUpdates = next.updates.some((update) => !previousIds.has(update.id));
  const indexingFinished = previous.indexingActive && !next.indexingActive;
  return { hasNewUpdates, indexingFinished };
}
