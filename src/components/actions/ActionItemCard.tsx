import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatRelativeTime } from '@/lib/utils';
import type { ActionItem, Project } from '@/types/database';

export type ActionItemWithProject = ActionItem & {
  project?: Pick<Project, 'client_name' | 'project_name'>;
};

const KIND_LABELS: Record<string, string> = {
  commitment: 'Commitment',
  decision: 'Decision',
  risk: 'Risk',
};

export function ActionItemCard({
  item,
  showProject = false,
  compact = false,
}: {
  item: ActionItemWithProject;
  showProject?: boolean;
  compact?: boolean;
}) {
  const kindLabel = item.item_kind ? KIND_LABELS[item.item_kind] ?? item.item_kind : null;

  return (
    <Card className={compact ? 'p-4' : undefined}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            {kindLabel && <Badge variant="neutral">{kindLabel}</Badge>}
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {formatRelativeTime(item.created_at)}
            </span>
          </div>
          <Link
            href={`/projects/${item.project_id}/overview`}
            className="text-sm font-medium text-gray-900 hover:text-blue-600 dark:text-gray-100 dark:hover:text-blue-400"
          >
            {item.title}
          </Link>
          {showProject && item.project && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {item.project.client_name} · {item.project.project_name}
            </p>
          )}
          {item.owner && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Owner: {item.owner}</p>
          )}
        </div>
        {item.due_date && (
          <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500">Due {item.due_date}</span>
        )}
      </div>
    </Card>
  );
}

export function ActionItemsList({
  items,
  showProject = false,
  compact = false,
}: {
  items: ActionItemWithProject[];
  showProject?: boolean;
  compact?: boolean;
}) {
  if (!items.length) {
    return (
      <p className="py-4 text-sm text-gray-500 dark:text-gray-400">
        No open action items for you right now.
      </p>
    );
  }

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      {items.map((item) => (
        <ActionItemCard key={item.id} item={item} showProject={showProject} compact={compact} />
      ))}
    </div>
  );
}
