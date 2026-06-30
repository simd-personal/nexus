import type { DashboardPortfolioScope } from '@/lib/projects/portfolio';

export function parsePortfolioScope(value: string | null | undefined): DashboardPortfolioScope {
  if (value === 'personal' || value === 'all' || value === 'work') return value;
  return 'work';
}
