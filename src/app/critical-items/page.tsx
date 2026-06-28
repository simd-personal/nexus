import { AppShell } from '@/components/layout/AppShell';
import { CriticalItemsList } from '@/components/critical/CriticalItemCard';
import { getCriticalItems } from '@/lib/data/queries';

export default async function CriticalItemsPage() {
  const items = await getCriticalItems();

  return (
    <AppShell>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Critical Items</h1>
          <p className="text-sm text-gray-500 mt-1">
            Issues Sunny has flagged across all projects
          </p>
        </div>

        <CriticalItemsList items={items} showProject />
      </div>
    </AppShell>
  );
}
