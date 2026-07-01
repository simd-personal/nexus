'use client';

import {
  compactTimelineSummary,
  timelineEventDetail,
  timelineEventIsExpandable,
  timelineEventLabel,
} from '@upperdeck/shared/timeline-summary';
import { formatRelativeTime } from '@/lib/utils';
import type { TimelineEvent } from '@/types/database';
import {
  FileText,
  Mail,
  Calendar,
  AlertTriangle,
  CheckSquare,
  Sun,
  BookOpen,
  Send,
  GitCompare,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const eventIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  meeting: Calendar,
  file_upload: FileText,
  email: Mail,
  note: FileText,
  sunny_summary: Sun,
  critical_item: AlertTriangle,
  action_item: CheckSquare,
  playbook: BookOpen,
  follow_up_email: Send,
  contradiction: GitCompare,
  file_replaced: GitCompare,
};

type TimelineViewProps = {
  events: TimelineEvent[];
  expandable?: boolean;
};

function TimelineEventCard({
  event,
  expanded,
  expandable,
  onToggle,
}: {
  event: TimelineEvent;
  expanded: boolean;
  expandable: boolean;
  onToggle: () => void;
}) {
  const label = timelineEventLabel(event.event_type);
  const summary = expanded ? timelineEventDetail(event) : compactTimelineSummary(event);
  const showChevron = expandable;

  const body = (
    <>
      <div className="flex items-center justify-between gap-2 mb-1">
        <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 truncate">
          {label} · {formatRelativeTime(event.created_at)}
        </p>
        {showChevron ? (
          expanded ? (
            <ChevronUp className="w-3.5 h-3.5 shrink-0 text-gray-400 dark:text-gray-500" aria-hidden />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 shrink-0 text-gray-400 dark:text-gray-500" aria-hidden />
          )
        ) : null}
      </div>
      <p
        className={`text-[13px] leading-[18px] font-medium text-gray-900 dark:text-gray-100 ${
          expanded ? '' : 'line-clamp-3'
        }`}
      >
        {summary}
      </p>
    </>
  );

  if (!expandable) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 dark:border-gray-700 dark:bg-gray-900">
        {body}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-left transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800/80"
    >
      {body}
    </button>
  );
}

export function TimelineView({ events, expandable = false }: TimelineViewProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    return () => setExpandedIds(new Set());
  }, []);

  if (!events.length) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
        No timeline events yet. Upload materials to see the project story unfold.
      </p>
    );
  }

  function toggleExpanded(eventId: string) {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(eventId)) next.delete(eventId);
      else next.add(eventId);
      return next;
    });
  }

  return (
    <div className="space-y-2">
      {events.map((event, index) => {
        const Icon = eventIcons[event.event_type] ?? FileText;
        const isLast = index === events.length - 1;
        const canExpand = expandable && timelineEventIsExpandable(event);
        const isExpanded = expandedIds.has(event.id);

        return (
          <div key={event.id} className="flex gap-3">
            <div className="flex w-7 flex-col items-center">
              <div className="flex h-7 w-7 items-center justify-center rounded-full border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40">
                <Icon className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              </div>
              {!isLast ? <div className="mt-1 w-0.5 flex-1 rounded-full bg-gray-200 dark:bg-gray-700" /> : null}
            </div>

            <div className="min-w-0 flex-1 pb-1">
              <TimelineEventCard
                event={event}
                expanded={isExpanded}
                expandable={canExpand}
                onToggle={() => toggleExpanded(event.id)}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
