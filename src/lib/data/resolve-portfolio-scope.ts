import {
  getDashboardPortfolioPreference,
} from '@/lib/data/queries';
import {
  resolveDashboardPortfolioScope,
  type DashboardPortfolioScope,
} from '@/lib/projects/portfolio';

export async function resolveActivePortfolioScope(
  searchParams?: { portfolio?: string }
): Promise<DashboardPortfolioScope> {
  const preference = await getDashboardPortfolioPreference();
  return resolveDashboardPortfolioScope(searchParams?.portfolio, preference);
}
