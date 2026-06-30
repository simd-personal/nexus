'use client';

import { formatNaturalSummary } from '@/lib/ai/generation-prompts';
import { buildDiffStatsLabel } from '@/lib/files/text-diff';
import type { FileRevision } from '@/types/database';
import { formatRelativeTime } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export function FileRevisionPanel({ fileId }: { fileId: string }) {
  const [revisions, setRevisions] = useState<FileRevision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/files/${fileId}/revisions`, { credentials: 'same-origin' });
        const data = (await res.json()) as { data?: FileRevision[]; error?: string };
        if (!res.ok) {
          throw new Error(data.error ?? 'Could not load change history');
        }
        if (!cancelled) {
          setRevisions(data.data ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load change history');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [fileId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-gray-500 dark:text-gray-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading change summary…
      </div>
    );
  }

  if (error) {
    return <p className="py-6 text-sm text-red-600">{error}</p>;
  }

  if (revisions.length === 0) {
    return (
      <p className="py-6 text-sm text-gray-500 dark:text-gray-400">
        No replacement history yet. When you replace this file, Sunny will summarize what changed here.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {revisions.map((revision) => (
        <article
          key={revision.id}
          className="rounded-xl border border-gray-200 bg-gray-50/70 p-4 dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-stone)]/40"
        >
          <div className="mb-2 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">What changed</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatRelativeTime(revision.created_at)}
                {' · '}
                {buildDiffStatsLabel(revision.diff_stats)}
              </p>
            </div>
          </div>

          <p className="text-sm text-gray-800 dark:text-gray-200">
            {formatNaturalSummary(revision.ai_summary)}
          </p>

          {revision.diff_preview && (
            <details className="mt-3">
              <summary className="cursor-pointer text-xs font-medium text-gray-600 dark:text-gray-300">
                View line diff
              </summary>
              <pre className="mt-2 max-h-64 overflow-auto rounded-lg border border-gray-200 bg-white p-3 text-xs leading-relaxed text-gray-800 dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-mist)] dark:text-gray-100">
                {revision.diff_preview}
              </pre>
            </details>
          )}
        </article>
      ))}
    </div>
  );
}

export function FileRevisionBadge({
  summary,
  updatedAt,
}: {
  summary?: string | null;
  updatedAt?: string | null;
}) {
  if (!summary) return null;

  return (
    <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">
      Updated {updatedAt ? formatRelativeTime(updatedAt) : 'recently'} — {formatNaturalSummary(summary)}
    </p>
  );
}
