'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { CitationsList } from '@/components/ui/Citations';
import { formatNaturalSummary } from '@/lib/ai/generation-prompts';
import { formatRelativeTime } from '@/lib/utils';
import type { SunnyUpdate } from '@/types/database';
import { SunnyAvatar } from '@/components/brand/SunnyAvatar';
import Link from 'next/link';
import type { ActiveUploadBatch, PendingIndexingFile } from '@/lib/processing/upload-batch';
import { IndexingStatusList } from '@/components/updates/IndexingBatchCard';

const COPYABLE_INSET_CLASS =
  'mt-3 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4';

function CopyableSection({
  label,
  text,
  className = COPYABLE_INSET_CLASS,
}: {
  label: string;
  text: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const formatted = formatNaturalSummary(text);

  async function handleCopy() {
    await navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      className={`group w-full text-left transition-opacity hover:opacity-90 ${className}`}
      aria-label={copied ? `${label} copied` : `Copy ${label}`}
    >
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <p className="app-eyebrow">{label}</p>
        <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300">
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Tap to copy
            </>
          )}
        </span>
      </div>
      <p className="text-sm text-gray-700 dark:text-gray-300">{formatted}</p>
    </button>
  );
}

export function SunnyUpdateCard({ update }: { update: SunnyUpdate }) {
  return (
    <Card>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          <SunnyAvatar size="sm" />
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
            <CopyableSection label="Why it matters" text={update.why_it_matters} />
          )}

          {update.suggested_action && (
            <CopyableSection label="Suggested action" text={update.suggested_action} />
          )}

          <CitationsList citations={update.source_citations} projectId={update.project_id} />
        </div>
      </div>
    </Card>
  );
}

export function SunnyUpdatesList({
  updates,
  pendingBatches = [],
  pendingFiles = [],
}: {
  updates: SunnyUpdate[];
  pendingBatches?: ActiveUploadBatch[];
  pendingFiles?: PendingIndexingFile[];
}) {
  const indexingActive = pendingBatches.length > 0 || pendingFiles.length > 0;

  if (!updates.length && !indexingActive) {
    return (
      <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
        No updates yet. Upload project materials and Sunny will start reporting.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <IndexingStatusList batches={pendingBatches} files={pendingFiles} />
      {updates.map((update) => (
        <SunnyUpdateCard key={update.id} update={update} />
      ))}
    </div>
  );
}
