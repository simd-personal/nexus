import {
  globalChatScopeHref,
  parseDashboardPortfolioScope,
  type DashboardPortfolioScope,
} from '@/lib/projects/portfolio';

const PROJECT_PATH_RE = /^\/projects\/([^/]+)(?:\/|$)/;

/** Project id when the user is on any /projects/[id]/… route. */
export function projectIdFromPathname(pathname: string): string | undefined {
  return pathname.match(PROJECT_PATH_RE)?.[1];
}

/** Scope global app routes to the current project or portfolio context. */
export function scopedAppHref(
  pathname: string,
  href: string,
  options?: { portfolioScope?: DashboardPortfolioScope | null }
): string {
  const projectId = projectIdFromPathname(pathname);
  if (projectId) {
    if (href === '/sunny') return `/projects/${projectId}/ask-sunny`;
    return href;
  }

  if (href === '/sunny') {
    return globalChatScopeHref(href, options?.portfolioScope);
  }

  return href;
}

export function portfolioScopeFromSearchParams(
  searchParams?: URLSearchParams | null
): DashboardPortfolioScope | null {
  return parseDashboardPortfolioScope(searchParams?.get('portfolio'));
}
