import { AppShell } from '@/components/layout/AppShell';
import { ActionItemsPageClient } from '@/components/actions/ActionItemsPageClient';
import { PortfolioScopeHeader } from '@/components/dashboard/PortfolioScopeHeader';
import { getActionItemsByStatus, getOpenActionItems } from '@/lib/data/queries';
import { resolveActivePortfolioScope } from '@/lib/data/resolve-portfolio-scope';

export const dynamic = 'force-dynamic';

export default async function ActionItemsPage({
  searchParams,
}: {
  searchParams: Promise<{ portfolio?: string }>;
}) {
  const params = await searchParams;
  const portfolioScope = await resolveActivePortfolioScope(params);

  const [openItems, inProgressItems, doneItems, dismissedItems] = await Promise.all([
    getOpenActionItems(undefined, portfolioScope),
    getActionItemsByStatus('in_progress', 50, portfolioScope),
    getActionItemsByStatus('done', 50, portfolioScope),
    getActionItemsByStatus('cancelled', 50, portfolioScope),
  ]);

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="app-page-title text-2xl">Your Action Items</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Open follow-ups Sunny surfaced for you in your selected portfolio
          </p>
        </div>

        <PortfolioScopeHeader scope={portfolioScope} />

        <ActionItemsPageClient
          openItems={openItems}
          inProgressItems={inProgressItems}
          doneItems={doneItems}
          dismissedItems={dismissedItems}
        />
      </div>
    </AppShell>
  );
}
