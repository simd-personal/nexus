'use client';

import { SeverityBadge, CategoryBadge, StatusBadge } from '@/components/ui/Badge';
import { CitationsList } from '@/components/ui/Citations';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { updateCriticalItemStatus } from '@/lib/actions/projects';
import type { CriticalItem } from '@/types/database';
import Link from 'next/link';

export function CriticalItemCard({ item, showProject = false }: { item: CriticalItem; showProject?: boolean }) {
  async function handleAcknowledge() {
    await updateCriticalItemStatus(item.id, 'acknowledged');
  }

  async function handleResolve() {
    await updateCriticalItemStatus(item.id, 'resolved');
  }

  const isHighPriority = item.severity === 'critical' || item.severity === 'high';

  return (
    <Card className={isHighPriority ? 'border-red-200 bg-red-50/30' : ''}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <SeverityBadge severity={item.severity} />
            <CategoryBadge category={item.category} />
            <StatusBadge status={item.status} />
          </div>
          <h4 className="text-base font-semibold text-gray-900">{item.title}</h4>
          {showProject && item.project && (
            <Link href={`/projects/${item.project_id}/overview`} className="text-sm text-blue-600 hover:underline">
              {item.project.client_name} — {item.project.project_name}
            </Link>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-700 mb-3">{item.summary}</p>

      {item.sunny_reasoning && (
        <div className="bg-amber-50 rounded-lg p-3 mb-3">
          <p className="text-xs font-medium text-amber-800 mb-1">Why Sunny flagged this</p>
          <p className="text-sm text-amber-900">{item.sunny_reasoning}</p>
        </div>
      )}

      {item.suggested_next_action && (
        <div className="mb-3">
          <p className="text-xs font-medium text-gray-500 mb-1">Suggested next action</p>
          <p className="text-sm text-gray-700">{item.suggested_next_action}</p>
          {item.suggested_owner && (
            <p className="text-xs text-gray-500 mt-1">Suggested owner: {item.suggested_owner}</p>
          )}
        </div>
      )}

      <CitationsList citations={item.source_citations} />

      {item.status === 'open' && (
        <div className="flex gap-2 mt-4">
          <Button variant="secondary" size="sm" onClick={handleAcknowledge}>Acknowledge</Button>
          <Button variant="ghost" size="sm" onClick={handleResolve}>Resolve</Button>
        </div>
      )}
    </Card>
  );
}

export function CriticalItemsList({ items, showProject = false }: { items: CriticalItem[]; showProject?: boolean }) {
  if (!items.length) {
    return (
      <p className="text-sm text-gray-500 py-4">No critical items found. Sunny is monitoring your projects.</p>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <CriticalItemCard key={item.id} item={item} showProject={showProject} />
      ))}
    </div>
  );
}
