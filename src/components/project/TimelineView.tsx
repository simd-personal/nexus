import { formatNaturalSummary } from '@/lib/ai/generation-prompts';
import { formatRelativeTime } from '@/lib/utils';
import type { TimelineEvent } from '@/types/database';
import {
  FileText, Mail, Calendar, AlertTriangle, CheckSquare,
  Sun, BookOpen, Send, GitCompare,
} from 'lucide-react';

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

export function TimelineView({ events }: { events: TimelineEvent[] }) {
  if (!events.length) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
        No timeline events yet. Upload materials to see the project story unfold.
      </p>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />
      <div className="space-y-6">
        {events.map((event) => {
          const Icon = eventIcons[event.event_type] ?? FileText;
          return (
            <div key={event.id} className="relative flex gap-4 pl-10">
              <div className="absolute left-2.5 w-3 h-3 rounded-full bg-white border-2 border-gray-300" />
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 -ml-10 relative z-10">
                <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </div>
              <div className="flex-1 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {new Date(event.created_at).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {formatRelativeTime(event.created_at)}
                  </span>
                </div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-0.5">{event.title}</h4>
                {event.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {event.event_type === 'sunny_summary' ||
                    event.event_type === 'contradiction' ||
                    event.event_type === 'file_replaced'
                      ? formatNaturalSummary(event.description)
                      : event.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
