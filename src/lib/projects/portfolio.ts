export type ProjectPortfolio = 'work' | 'personal';
export type DashboardPortfolioScope = 'work' | 'personal' | 'all';

export const PROJECT_PORTFOLIOS: ProjectPortfolio[] = ['work', 'personal'];
export const DASHBOARD_PORTFOLIO_SCOPES: DashboardPortfolioScope[] = ['work', 'personal', 'all'];

const PORTFOLIO_LABELS: Record<ProjectPortfolio, string> = {
  work: 'Work',
  personal: 'Personal',
};

const SCOPE_LABELS: Record<DashboardPortfolioScope, string> = {
  work: 'Work',
  personal: 'Personal',
  all: 'All projects',
};

export function projectPortfolioLabel(portfolio: ProjectPortfolio): string {
  return PORTFOLIO_LABELS[portfolio];
}

export function dashboardScopeLabel(scope: DashboardPortfolioScope): string {
  return SCOPE_LABELS[scope];
}

export function parseProjectPortfolio(value: string | null | undefined): ProjectPortfolio {
  return value === 'personal' ? 'personal' : 'work';
}

export function parseDashboardPortfolioScope(
  value: string | null | undefined
): DashboardPortfolioScope | null {
  if (value === 'work' || value === 'personal' || value === 'all') return value;
  return null;
}

export function resolveDashboardPortfolioScope(
  urlScope: string | null | undefined,
  profileDefault: DashboardPortfolioScope | null | undefined
): DashboardPortfolioScope {
  return parseDashboardPortfolioScope(urlScope) ?? profileDefault ?? 'work';
}

/** Preserve active portfolio when linking between scoped aggregate pages. */
export function portfolioScopeHref(
  basePath: string,
  scope: DashboardPortfolioScope
): string {
  return `${basePath}?portfolio=${scope}`;
}

/** Carry dashboard portfolio context onto global chat/search routes. */
export function globalChatScopeHref(
  basePath: '/sunny',
  portfolioScope?: DashboardPortfolioScope | null
): string {
  if (!portfolioScope) return basePath;
  return `${basePath}?portfolio=${portfolioScope}`;
}
