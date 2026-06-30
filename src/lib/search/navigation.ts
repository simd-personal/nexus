import type { DashboardPortfolioScope } from '@/lib/projects/portfolio';

export type GlobalSearchHrefOptions = {
  projectId?: string;
  portfolio?: DashboardPortfolioScope;
};

/** Build the Sunny search URL used by the dashboard and project global search bars. */
export function buildGlobalSearchHref(
  query: string,
  options?: string | GlobalSearchHrefOptions
): string | null {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const opts = typeof options === 'string' ? { projectId: options } : options;
  const params = new URLSearchParams({ q: trimmed });

  if (opts?.projectId) {
    params.set('project', opts.projectId);
  } else if (opts?.portfolio && opts.portfolio !== 'all') {
    params.set('portfolio', opts.portfolio);
  }

  return `/search?${params.toString()}`;
}
