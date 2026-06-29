'use client';

import { useState } from 'react';
import { ActionItemsList, type ActionItemWithProject } from '@/components/actions/ActionItemCard';
import { cn } from '@/lib/utils';

type TabId = 'open' | 'in_progress' | 'done' | 'not_for_me';

const TABS: { id: TabId; label: string }[] = [
  { id: 'open', label: 'Open' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'done', label: 'Done' },
  { id: 'not_for_me', label: 'Not for me' },
];

const EMPTY_MESSAGES: Record<TabId, string> = {
  open: 'No open action items for you right now.',
  in_progress: 'Nothing marked as in progress.',
  done: 'No completed action items yet.',
  not_for_me: 'No dismissed action items.',
};

export function ActionItemsPageClient({
  openItems,
  inProgressItems,
  doneItems,
  dismissedItems,
}: {
  openItems: ActionItemWithProject[];
  inProgressItems: ActionItemWithProject[];
  doneItems: ActionItemWithProject[];
  dismissedItems: ActionItemWithProject[];
}) {
  const [tab, setTab] = useState<TabId>('open');

  const itemsByTab: Record<TabId, ActionItemWithProject[]> = {
    open: openItems,
    in_progress: inProgressItems,
    done: doneItems,
    not_for_me: dismissedItems,
  };

  const counts: Record<TabId, number> = {
    open: openItems.length,
    in_progress: inProgressItems.length,
    done: doneItems.length,
    not_for_me: dismissedItems.length,
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2 border-b border-gray-200 dark:border-[var(--ud-cloud)]">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              '-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors',
              tab === id
                ? 'border-[var(--brand-accent)] text-gray-900 dark:text-gray-100'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            )}
          >
            {label}
            {counts[id] > 0 && (
              <span className="ml-1.5 text-xs text-gray-400 dark:text-gray-500">({counts[id]})</span>
            )}
          </button>
        ))}
      </div>

      <ActionItemsList
        key={tab}
        items={itemsByTab[tab]}
        showProject
        showActions={tab === 'open' || tab === 'in_progress'}
        emptyMessage={EMPTY_MESSAGES[tab]}
      />
    </div>
  );
}
