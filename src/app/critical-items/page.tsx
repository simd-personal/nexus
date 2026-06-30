import { AppShell } from '@/components/layout/AppShell';
import { CriticalItemsList } from '@/components/critical/CriticalItemCard';
import { PortfolioScopeHeader } from '@/components/dashboard/PortfolioScopeHeader';
import { getCriticalItems } from '@/lib/data/queries';
import { resolveActivePortfolioScope } from '@/lib/data/resolve-portfolio-scope';

export const dynamic = 'force-dynamic';

export default async function CriticalItemsPage({
  searchParams,
}: {
  searchParams: Promise<{ portfolio?: string }>;
}) {
  const params = await searchParams;
  const portfolioScope = await resolveActivePortfolioScope(params);
  const items = await getCriticalItems(undefined, portfolioScope);

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="app-page-title text-2xl">Critical Items</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Issues Sunny has flagged in your selected portfolio
          </p>
        </div>

        <PortfolioScopeHeader scope={portfolioScope} />

        <CriticalItemsList items={items} showProject />
      </div>
    </AppShell>
  );
}
