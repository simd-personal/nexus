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
        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
          <Sun className="w-4 h-4 text-amber-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-4">
            <h4 className="text-base font-semibold text-gray-900">{update.title}</h4>
            <span className="text-xs text-gray-400 shrink-0">{formatRelativeTime(update.created_at)}</span>
          </div>

          {update.project && (
            <Link
              href={`/projects/${update.project_id}/overview`}
              className="text-sm text-blue-600 hover:underline"
            >
              {update.project.client_name} · {update.project.project_name}
            </Link>
          )}

          <p className="text-sm text-gray-700 mt-2">{formatNaturalSummary(update.summary)}</p>

          {update.why_it_matters && (
            <div className="mt-3 bg-gray-50 rounded-lg p-3">
              <p className="text-xs font-medium text-gray-500 mb-1">Why it matters</p>
              <p className="text-sm text-gray-700">{formatNaturalSummary(update.why_it_matters)}</p>
            </div>
          )}

          {update.suggested_action && (
            <div className="mt-3">
              <p className="text-xs font-medium text-gray-500 mb-1">Suggested action</p>
              <p className="text-sm text-gray-700">{formatNaturalSummary(update.suggested_action)}</p>
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
      <p className="text-sm text-gray-500 py-8 text-center">
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
