import { CriticalItemsList } from '@/components/critical/CriticalItemCard';
import { getProjectCriticalItems } from '@/lib/data/queries';

export default async function ProjectCriticalItemsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const items = await getProjectCriticalItems(id);

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Critical Items</h2>
      <CriticalItemsList items={items} />
    </div>
  );
}
