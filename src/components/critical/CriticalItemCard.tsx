'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SeverityBadge, CategoryBadge, StatusBadge } from '@/components/ui/Badge';
import { CitationsList } from '@/components/ui/Citations';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { updateCriticalItemStatus } from '@/lib/actions/projects';
import { formatNaturalSummary } from '@/lib/ai/generation-prompts';
import type { CriticalItem } from '@/types/database';
import Link from 'next/link';

export function CriticalItemCard({
  item,
  showProject = false,
  syncOnUpdate = true,
  onRemoved,
}: {
  item: CriticalItem;
  showProject?: boolean;
  syncOnUpdate?: boolean;
  onRemoved?: (itemId: string) => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleStatus(next: 'acknowledged' | 'resolved') {
    if (busy) return;
    setBusy(true);
    const result = await updateCriticalItemStatus(item.id, next);
    setBusy(false);
    if (result.error) return;
    onRemoved?.(item.id);
    if (syncOnUpdate) router.refresh();
  }

  const isHighPriority = item.severity === 'critical' || item.severity === 'high';

  return (
    <Card className={isHighPriority ? 'border-red-200 bg-red-50/30 dark:border-red-800 dark:bg-red-950/20' : ''}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <SeverityBadge severity={item.severity} />
            <CategoryBadge category={item.category} />
            <StatusBadge status={item.status} />
          </div>
          <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">{item.title}</h4>
          {showProject && item.project && (
            <Link href={`/projects/${item.project_id}/overview`} className="text-sm text-blue-600 hover:underline dark:text-blue-400">
              {item.project.client_name} · {item.project.project_name}
            </Link>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-700 mb-3 dark:text-gray-300">{formatNaturalSummary(item.summary)}</p>

      {item.sunny_reasoning && (
        <div className="bg-amber-50 rounded-lg p-3 mb-3 dark:bg-amber-950/30">
          <p className="text-xs font-medium text-amber-800 mb-1 dark:text-amber-300">Why Sunny flagged this</p>
          <p className="text-sm text-amber-900 dark:text-amber-200">{formatNaturalSummary(item.sunny_reasoning)}</p>
        </div>
      )}

      {item.suggested_next_action && (
        <div className="mb-3">
          <p className="text-xs font-medium text-gray-500 mb-1 dark:text-gray-400">Suggested next action</p>
          <p className="text-sm text-gray-700 dark:text-gray-300">{formatNaturalSummary(item.suggested_next_action)}</p>
          {item.suggested_owner && (
            <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">Suggested owner: {item.suggested_owner}</p>
          )}
        </div>
      )}

      <CitationsList citations={item.source_citations} projectId={item.project_id} />

      {item.status === 'open' && (
        <div className="flex gap-2 mt-4">
          <Button variant="secondary" size="sm" disabled={busy} onClick={() => void handleStatus('acknowledged')}>
            Acknowledge
          </Button>
          <Button variant="ghost" size="sm" disabled={busy} onClick={() => void handleStatus('resolved')}>
            Resolve
          </Button>
        </div>
      )}
    </Card>
  );
}

export function CriticalItemsList({
  items: initialItems,
  showProject = false,
  syncOnUpdate = true,
  onCountChange,
  onListEmpty,
}: {
  items: CriticalItem[];
  showProject?: boolean;
  syncOnUpdate?: boolean;
  onCountChange?: (delta: number) => void;
  onListEmpty?: () => void;
}) {
  const [items, setItems] = useState(initialItems);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  function handleRemoved(itemId: string) {
    setItems((current) => {
      const next = current.filter((entry) => entry.id !== itemId);
      if (next.length === 0) onListEmpty?.();
      return next;
    });
    onCountChange?.(-1);
  }

  if (!items.length) {
    return (
      <p className="text-sm text-gray-500 py-4 dark:text-gray-400">No critical items found. Sunny is monitoring your projects.</p>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <CriticalItemCard
          key={item.id}
          item={item}
          showProject={showProject}
          syncOnUpdate={syncOnUpdate}
          onRemoved={handleRemoved}
        />
      ))}
    </div>
  );
}
