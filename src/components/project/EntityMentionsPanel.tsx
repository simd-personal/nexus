'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { SOURCE_TYPE_LABELS } from '@/lib/constants';
import type { EntityMentionResult } from '@/lib/entities/mentions';
import type { SourceType } from '@/types/database';
import { ExternalLink, Loader2, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

function HighlightedSnippet({ text, query }: { text: string; query: string }) {
  const lower = text.toLowerCase();
  const qLower = query.toLowerCase();
  const index = lower.indexOf(qLower);

  if (index === -1) {
    return <span>{text}</span>;
  }

  return (
    <span>
      {text.slice(0, index)}
      <mark className="rounded bg-amber-100 px-0.5 text-gray-900 dark:bg-amber-500/30 dark:text-gray-100">
        {text.slice(index, index + query.length)}
      </mark>
      {text.slice(index + query.length)}
    </span>
  );
}

export function EntityMentionsPanel({
  projectId,
  name,
  type,
  includeSubProjects,
  open,
  onClose,
}: {
  projectId: string;
  name: string;
  type: 'person' | 'facility';
  includeSubProjects?: boolean;
  open: boolean;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EntityMentionResult | null>(null);

  const loadMentions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        name,
        type,
        ...(includeSubProjects ? { includeSubProjects: 'true' } : {}),
      });
      const res = await fetch(`/api/projects/${projectId}/entities/mentions?${params}`);
      if (!res.ok) {
        throw new Error('Could not load source mentions');
      }
      setResult((await res.json()) as EntityMentionResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load mentions');
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [projectId, name, type, includeSubProjects]);

  useEffect(() => {
    if (!open) {
      setResult(null);
      setError(null);
      return;
    }
    loadMentions();
  }, [open, loadMentions]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const sourceCount = result?.sources.length ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close mentions panel"
        onClick={onClose}
      />
      <div
        className="relative z-10 flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-xl dark:bg-[var(--ud-mist)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="entity-mentions-title"
      >
        <div className="flex items-start justify-between border-b border-gray-200 px-5 py-4 dark:border-[var(--ud-cloud)]">
          <div className="min-w-0 pr-4">
            <h2 id="entity-mentions-title" className="truncate text-lg font-semibold text-gray-900 dark:text-gray-100">
              {name}
            </h2>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              {loading
                ? 'Searching project sources…'
                : sourceCount === 0
                  ? 'No source passages found'
                  : `Mentioned in ${sourceCount} source${sourceCount !== 1 ? 's' : ''}`}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-500 dark:text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Finding mentions…
            </div>
          )}

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </p>
          )}

          {!loading && !error && result?.sources.length === 0 && (
            <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              No source passages found — try reprocessing files if this name should appear in your materials.
            </p>
          )}

          {!loading && !error && result && result.sources.length > 0 && (
            <div className="space-y-4">
              {result.sources.map((source) => (
                <div
                  key={source.file_id}
                  className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-cloud)]/20"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                      {source.file_name}
                    </p>
                    {source.source_type && (
                      <span className="rounded-full bg-white px-2 py-0.5 text-xs text-gray-600 dark:bg-[var(--ud-mist)] dark:text-gray-300">
                        {SOURCE_TYPE_LABELS[source.source_type as SourceType] ?? source.source_type}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 space-y-2">
                    {source.snippets.map((snippet, index) => (
                      <blockquote
                        key={`${source.file_id}-${snippet.chunk_index}-${index}`}
                        className="border-l-2 border-gray-300 pl-3 text-sm leading-relaxed text-gray-600 dark:border-gray-600 dark:text-gray-300"
                      >
                        <HighlightedSnippet text={snippet.text} query={name} />
                        {snippet.page_number != null && (
                          <span className="mt-1 block text-xs text-gray-400 dark:text-gray-500">
                            Page {snippet.page_number}
                          </span>
                        )}
                      </blockquote>
                    ))}
                  </div>

                  <div className="mt-3">
                    <Link
                      href={`/projects/${projectId}/files?file=${source.file_id}`}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-900 underline-offset-2 hover:underline dark:text-gray-100"
                    >
                      Open document
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
