import { AppShell } from '@/components/layout/AppShell';
import { ActionItemsPageClient } from '@/components/actions/ActionItemsPageClient';
import { getActionItemsByStatus, getOpenActionItems } from '@/lib/data/queries';

export const dynamic = 'force-dynamic';

export default async function ActionItemsPage() {
  const [openItems, inProgressItems, doneItems, dismissedItems] = await Promise.all([
    getOpenActionItems(),
    getActionItemsByStatus('in_progress'),
    getActionItemsByStatus('done'),
    getActionItemsByStatus('cancelled'),
  ]);

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="app-page-title text-2xl">Your Action Items</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Open follow-ups Sunny surfaced for you across all projects
          </p>
        </div>

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
