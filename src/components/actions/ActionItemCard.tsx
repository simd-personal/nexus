'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { updateActionItemStatus } from '@/lib/actions/projects';
import { formatRelativeTime } from '@/lib/utils';
import type { ActionItem, ActionItemStatus, Project } from '@/types/database';

export type ActionItemWithProject = ActionItem & {
  project?: Pick<Project, 'client_name' | 'project_name'>;
};

export type ActionItemUndoState = {
  itemId: string;
  previousStatus: ActionItemStatus;
  previousAppliesToMe: boolean;
  message: string;
  item: ActionItemWithProject;
};

const KIND_LABELS: Record<string, string> = {
  commitment: 'Commitment',
  decision: 'Decision',
  risk: 'Risk',
};

const MENU_WIDTH = 176;

type ActionItemCardProps = {
  item: ActionItemWithProject;
  showProject?: boolean;
  compact?: boolean;
  embedded?: boolean;
  block?: boolean;
  showActions?: boolean;
  onStatusChange?: (undo: ActionItemUndoState) => void;
};

export function ActionItemCard({
  item,
  showProject = false,
  compact = false,
  embedded = false,
  block = false,
  showActions = true,
  onStatusChange,
}: ActionItemCardProps) {
  const router = useRouter();
  const anchorRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!menuOpen) {
      setMenuPosition(null);
      return;
    }

    function updatePosition() {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      let left = rect.right - MENU_WIDTH;
      left = Math.max(8, Math.min(left, window.innerWidth - MENU_WIDTH - 8));
      setMenuPosition({ top: rect.bottom + 4, left });
    }

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-action-item-menu-root]') && !target.closest('[data-action-item-menu]')) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  const canAct = showActions && (item.status === 'open' || item.status === 'in_progress');

  async function applyStatus(
    nextStatus: ActionItemStatus,
    options?: { applies_to_me?: boolean },
    message?: string
  ) {
    if (busy) return;
    setBusy(true);
    setMenuOpen(false);

    const undo: ActionItemUndoState = {
      itemId: item.id,
      previousStatus: item.status,
      previousAppliesToMe: item.applies_to_me,
      message: message ?? 'Updated action item',
      item,
    };

    const result = await updateActionItemStatus(item.id, nextStatus, options);
    setBusy(false);

    if (result.error) return;

    onStatusChange?.(undo);
    router.refresh();
  }

  const kindLabel = item.item_kind ? KIND_LABELS[item.item_kind] ?? item.item_kind : null;

  const menu =
    menuOpen && menuPosition && mounted
      ? createPortal(
          <div
            data-action-item-menu
            role="menu"
            className="fixed z-50 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-mist)]"
            style={{ top: menuPosition.top, left: menuPosition.left }}
          >
            {item.status === 'open' && (
              <MenuItem
                label="Working on it"
                onClick={() => void applyStatus('in_progress', undefined, 'Marked as in progress')}
              />
            )}
            <MenuItem
              label="Not for me"
              onClick={() =>
                void applyStatus('cancelled', { applies_to_me: false }, 'Removed from your list')
              }
            />
          </div>,
          document.body
        )
      : null;

  return (
    <CardWrapper embedded={embedded || block} compact={compact || block}>
      <div className={block ? 'flex items-center justify-between gap-3 py-3 px-4 sm:px-5' : 'flex items-start justify-between gap-3'}>
        <div className="min-w-0 flex-1">
          {!block && (
            <div className="mb-1 flex flex-wrap items-center gap-2">
              {kindLabel && <Badge variant="neutral">{kindLabel}</Badge>}
              {item.status !== 'open' && (
                <Badge variant="neutral">{formatStatusLabel(item.status)}</Badge>
              )}
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {formatRelativeTime(item.created_at)}
              </span>
            </div>
          )}
          <Link
            href={`/projects/${item.project_id}/overview`}
            className={
              block
                ? 'line-clamp-2 text-sm font-medium text-gray-900 hover:text-blue-600 dark:text-gray-100 dark:hover:text-blue-400'
                : 'text-sm font-medium text-gray-900 hover:text-blue-600 dark:text-gray-100 dark:hover:text-blue-400'
            }
          >
            {item.title}
          </Link>
          {showProject && item.project && (
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              {item.project.client_name} · {item.project.project_name}
            </p>
          )}
          {!block && item.owner && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Owner: {item.owner}</p>
          )}
        </div>
        <div className={block ? 'flex shrink-0 items-center gap-1' : 'flex shrink-0 flex-col items-end gap-2'}>
          {!block && item.due_date && (
            <span className="text-xs text-gray-400 dark:text-gray-500">Due {item.due_date}</span>
          )}
          {canAct && (
            <div className="flex items-center gap-1">
              <Button
                variant="secondary"
                size="sm"
                disabled={busy}
                onClick={() => void applyStatus('done', undefined, 'Marked done')}
              >
                {block ? 'Done' : 'Mark done'}
              </Button>
              <div className="relative" data-action-item-menu-root ref={anchorRef}>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busy}
                  onClick={() => setMenuOpen((current) => !current)}
                  aria-label="More actions"
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  className="px-2"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
                {menu}
              </div>
            </div>
          )}
        </div>
      </div>
    </CardWrapper>
  );
}

function CardWrapper({
  embedded,
  compact,
  children,
}: {
  embedded: boolean;
  compact: boolean;
  children: React.ReactNode;
}) {
  if (embedded) {
    return <div>{children}</div>;
  }
  return <Card className={compact ? 'p-4' : undefined}>{children}</Card>;
}

function MenuItem({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="flex w-full items-center px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-[var(--ud-cloud)]"
    >
      {label}
    </button>
  );
}

function formatStatusLabel(status: ActionItemStatus): string {
  if (status === 'in_progress') return 'In progress';
  if (status === 'done') return 'Done';
  if (status === 'cancelled') return 'Not for me';
  return status;
}

export function ActionItemsList({
  items: initialItems,
  showProject = false,
  compact = false,
  embedded = false,
  block = false,
  previewCount = 2,
  totalCount,
  viewAllHref = '/action-items',
  showActions = true,
  emptyMessage = 'No open action items for you right now.',
}: {
  items: ActionItemWithProject[];
  showProject?: boolean;
  compact?: boolean;
  embedded?: boolean;
  block?: boolean;
  previewCount?: number;
  totalCount?: number;
  viewAllHref?: string;
  showActions?: boolean;
  emptyMessage?: string;
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [expanded, setExpanded] = useState(false);
  const [toast, setToast] = useState<ActionItemUndoState | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  function handleStatusChange(undo: ActionItemUndoState) {
    setItems((current) => current.filter((entry) => entry.id !== undo.itemId));
    setToast(undo);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 5000);
  }

  async function handleUndo() {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    const pending = toast;
    if (!pending) return;
    setToast(null);

    const result = await updateActionItemStatus(pending.itemId, pending.previousStatus, {
      applies_to_me: pending.previousAppliesToMe,
    });
    if (result.error) return;

    setItems((current) => [pending.item, ...current]);
    router.refresh();
  }

  if (!items.length) {
    return (
      <p className="py-4 text-sm text-gray-500 dark:text-gray-400">{emptyMessage}</p>
    );
  }

  const visibleItems = block && !expanded ? items.slice(0, previewCount) : items;
  const localHiddenCount = Math.max(0, items.length - previewCount);
  const remoteHiddenCount =
    totalCount !== undefined ? Math.max(0, totalCount - items.length) : 0;
  const showExpand = block && !expanded && localHiddenCount > 0;
  const showCollapse = block && expanded && items.length > previewCount;
  const showViewAll = block && totalCount !== undefined && totalCount > items.length;

  const listBody = (
    <>
      {visibleItems.map((item, index) => (
        <div
          key={item.id}
          className={block && index > 0 ? 'border-t border-gray-100 dark:border-[var(--ud-cloud)]' : undefined}
        >
          <ActionItemCard
            item={item}
            showProject={showProject}
            compact={compact}
            embedded={embedded}
            block={block}
            showActions={showActions}
            onStatusChange={handleStatusChange}
          />
        </div>
      ))}

      {block && (showExpand || showCollapse || showViewAll) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 px-4 py-2.5 dark:border-[var(--ud-cloud)] sm:px-5">
          <div>
            {showExpand && (
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Show {localHiddenCount} more
              </button>
            )}
            {showCollapse && (
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="text-sm font-medium text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100"
              >
                Show less
              </button>
            )}
          </div>
          {showViewAll && (
            <Link
              href={viewAllHref}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              View all {totalCount}
            </Link>
          )}
        </div>
      )}
    </>
  );

  return (
    <>
      {block ? (
        embedded ? (
          <div>{listBody}</div>
        ) : (
          <Card padding={false} className="overflow-hidden">
            {listBody}
          </Card>
        )
      ) : (
        <div className={embedded ? undefined : compact ? 'space-y-2' : 'space-y-3'}>
          {visibleItems.map((item) => (
            <ActionItemCard
              key={item.id}
              item={item}
              showProject={showProject}
              compact={compact}
              embedded={embedded}
              showActions={showActions}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex max-w-sm items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 shadow-lg dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-mist)] dark:text-gray-100">
          <span className="flex-1">{toast.message}</span>
          <button
            type="button"
            onClick={() => void handleUndo()}
            className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Undo
          </button>
        </div>
      )}
    </>
  );
}
