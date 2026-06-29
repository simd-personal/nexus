'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronRight, GitBranch, FolderKanban, X } from 'lucide-react';
import {
  ALL_PROJECTS_SCOPE,
  buildChatScope,
  checkedIdsFromScope,
  formatScopeSummary,
  getNodeCheckState,
  projectLabel,
  removeScopeLabel,
  toggleNodeChecked,
  type ChatScope,
  type TreeCheckState,
} from '@/lib/chat/scope';
import type { ProjectWithStats } from '@/types/database';
import { cn } from '@/lib/utils';

interface ChatScopePickerProps {
  projects: ProjectWithStats[];
  scope: ChatScope;
  onScopeChange: (scope: ChatScope) => void;
  lockScope?: boolean;
  className?: string;
}

function CheckBox({
  state,
  onChange,
  disabled,
  label,
}: {
  state: TreeCheckState;
  onChange: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={state === 'indeterminate' ? 'mixed' : state === 'checked'}
      aria-label={label}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        onChange();
      }}
      className={cn(
        'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
        state === 'checked' && 'border-gray-900 bg-gray-900 text-white dark:border-gray-100 dark:bg-gray-100 dark:text-gray-900',
        state === 'indeterminate' && 'border-gray-900 bg-gray-900 text-white dark:border-gray-100 dark:bg-gray-100 dark:text-gray-900',
        state === 'unchecked' && 'border-gray-300 bg-white dark:border-gray-600 dark:bg-[var(--ud-mist)]',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {state === 'checked' && <span className="text-[10px] leading-none">✓</span>}
      {state === 'indeterminate' && <span className="text-[10px] leading-none">−</span>}
    </button>
  );
}

function ScopeTreeNode({
  node,
  depth,
  checkedIds,
  expandedIds,
  onToggleExpand,
  onToggleCheck,
  lockScope,
}: {
  node: ProjectWithStats;
  depth: number;
  checkedIds: Set<string>;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onToggleCheck: (node: ProjectWithStats) => void;
  lockScope?: boolean;
}) {
  const children = node.sub_projects ?? [];
  const hasChildren = children.length > 0;
  const expanded = expandedIds.has(node.id);
  const checkState = getNodeCheckState(node, checkedIds);
  const label = projectLabel(node);

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-[var(--ud-cloud)]',
          depth > 0 && 'ml-4 border-l border-gray-200 pl-3 dark:border-[var(--ud-cloud)]'
        )}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => onToggleExpand(node.id)}
            className="shrink-0 rounded p-0.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            aria-label={expanded ? 'Collapse workstreams' : 'Expand workstreams'}
          >
            {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        ) : (
          <span className="w-4 shrink-0" />
        )}
        <CheckBox
          state={checkState}
          onChange={() => onToggleCheck(node)}
          disabled={lockScope}
          label={label}
        />
        {hasChildren ? (
          <FolderKanban className="h-3.5 w-3.5 shrink-0 text-gray-400" />
        ) : depth > 0 ? (
          <GitBranch className="h-3.5 w-3.5 shrink-0 text-gray-400" />
        ) : (
          <FolderKanban className="h-3.5 w-3.5 shrink-0 text-gray-400" />
        )}
        <span className="min-w-0 flex-1 truncate text-xs text-gray-800 dark:text-gray-200">{label}</span>
        {hasChildren && (
          <span className="shrink-0 text-[10px] text-gray-400 dark:text-gray-500">
            {children.length} workstream{children.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      {hasChildren && expanded && (
        <div className="space-y-0.5">
          {children.map((child) => (
            <ScopeTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              checkedIds={checkedIds}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
              onToggleCheck={onToggleCheck}
              lockScope={lockScope}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function ChatScopeChips({
  scope,
  projects,
  onScopeChange,
  lockScope,
}: {
  scope: ChatScope;
  projects: ProjectWithStats[];
  onScopeChange?: (scope: ChatScope) => void;
  lockScope?: boolean;
}) {
  if (scope.kind === 'all') {
    return (
      <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs text-gray-600 dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-stone)] dark:text-gray-300">
        All projects
      </span>
    );
  }

  return (
    <>
      {scope.labels.map((label, index) => (
        <span
          key={`${label}-${index}`}
          className="inline-flex items-center gap-1 rounded-full border border-[rgba(124,108,240,0.25)] bg-[rgba(124,108,240,0.08)] px-2.5 py-1 text-xs text-gray-700 dark:text-gray-200"
        >
          {label}
          {!lockScope && onScopeChange && (
            <button
              type="button"
              onClick={() => onScopeChange(removeScopeLabel(projects, scope, label))}
              className="rounded-full p-0.5 text-gray-400 hover:bg-white/60 hover:text-gray-700 dark:hover:text-gray-100"
              aria-label={`Remove ${label} from scope`}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </span>
      ))}
    </>
  );
}

export function ChatScopePicker({
  projects,
  scope,
  onScopeChange,
  lockScope = false,
  className,
}: ChatScopePickerProps) {
  const [open, setOpen] = useState(false);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(() => checkedIdsFromScope(projects, scope));
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set(projects.map((p) => p.id)));
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCheckedIds(checkedIdsFromScope(projects, scope));
  }, [projects, scope]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  const applyCheckedIds = (next: Set<string>) => {
    setCheckedIds(next);
    onScopeChange(buildChatScope(projects, next));
  };

  const selectAllProjects = () => {
    setCheckedIds(new Set());
    onScopeChange(ALL_PROJECTS_SCOPE);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {!lockScope && (
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex max-w-[240px] items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-mist)] dark:text-gray-200 dark:hover:bg-[var(--ud-cloud)]"
        >
          <FolderKanban className="h-3.5 w-3.5 shrink-0 text-gray-400" />
          <span className="truncate">{formatScopeSummary(scope)}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-gray-400" />
        </button>
      )}

      {open && !lockScope && (
        <div className="absolute right-0 top-full z-30 mt-2 w-[min(320px,calc(100vw-2rem))] rounded-xl border border-gray-200 bg-white p-2 shadow-lg dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-mist)]">
          <button
            type="button"
            onClick={selectAllProjects}
            className={cn(
              'flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs hover:bg-gray-50 dark:hover:bg-[var(--ud-cloud)]',
              scope.kind === 'all' && 'bg-gray-100 dark:bg-[var(--ud-cloud)]'
            )}
          >
            <CheckBox
              state={scope.kind === 'all' ? 'checked' : 'unchecked'}
              onChange={selectAllProjects}
              label="All projects"
            />
            <span className="font-medium text-gray-800 dark:text-gray-200">All projects</span>
          </button>
          <div className="my-2 border-t border-gray-100 dark:border-[var(--ud-cloud)]" />
          <div className="max-h-72 space-y-0.5 overflow-y-auto">
            {projects.map((project) => (
              <ScopeTreeNode
                key={project.id}
                node={project}
                depth={0}
                checkedIds={checkedIds}
                expandedIds={expandedIds}
                onToggleExpand={(id) =>
                  setExpandedIds((current) => {
                    const next = new Set(current);
                    if (next.has(id)) next.delete(id);
                    else next.add(id);
                    return next;
                  })
                }
                onToggleCheck={(node) => applyCheckedIds(toggleNodeChecked(node, checkedIds))}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
