import { Card } from '@/components/ui/Card';
import { CitationsList } from '@/components/ui/Citations';
import { formatNaturalSummary } from '@/lib/ai/generation-prompts';
import { formatRelativeTime } from '@/lib/utils';
import type { SunnyUpdate } from '@/types/database';
import { Sun } from 'lucide-react';
import Link from 'next/link';

export function SunnyUpdateCard({ update }: { update: SunnyUpdate }) {
  return (
    <Card>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
          <Sun className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-4">
            <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">{update.title}</h4>
            <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500">{formatRelativeTime(update.created_at)}</span>
          </div>

          {update.project && (
            <Link
              href={`/projects/${update.project_id}/overview`}
              className="text-sm text-blue-600 hover:underline dark:text-blue-400"
            >
              {update.project.client_name} · {update.project.project_name}
            </Link>
          )}

          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{formatNaturalSummary(update.summary)}</p>

          {update.why_it_matters && (
            <div className="mt-3 rounded-lg bg-gray-50 p-3 dark:bg-[var(--ud-stone)]">
              <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">Why it matters</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{formatNaturalSummary(update.why_it_matters)}</p>
            </div>
          )}

          {update.suggested_action && (
            <div className="mt-3">
              <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">Suggested action</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{formatNaturalSummary(update.suggested_action)}</p>
            </div>
          )}

          <CitationsList citations={update.source_citations} projectId={update.project_id} />
        </div>
      </div>
    </Card>
  );
}

export function SunnyUpdatesList({ updates }: { updates: SunnyUpdate[] }) {
  if (!updates.length) {
    return (
      <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
        No updates yet. Upload project materials and Sunny will start reporting.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {updates.map((update) => (
        <SunnyUpdateCard key={update.id} update={update} />
      ))}
    </div>
  );
}
