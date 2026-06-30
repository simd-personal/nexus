import type { SupabaseClient } from '@supabase/supabase-js';
import { structuredExtraction, OPENAI_MODELS } from '@/lib/ai/openai';
import { formatNaturalSummary } from '@/lib/ai/generation-prompts';
import {
  buildDiffStatsLabel,
  computeTextDiff,
  type TextDiffResult,
} from '@/lib/files/text-diff';
import type { Citation } from '@/types/database';

export type PendingFileReplacement = {
  previous_text: string;
  replaced_at: string;
};

export type ReplacementSummary = {
  summary: string;
  ai_summary: string;
  diff: TextDiffResult;
  revisionId?: string;
};

const SAMPLE_LIMIT = 24;

function sampleLines(lines: string[]): string[] {
  return lines.slice(0, SAMPLE_LIMIT);
}

export async function summarizeReplacementDiff(
  fileName: string,
  diff: TextDiffResult
): Promise<{ summary: string; ai_summary: string }> {
  if (diff.additions.length === 0 && diff.removals.length === 0) {
    const summary = 'File replaced with no detectable line-level changes.';
    return { summary, ai_summary: summary };
  }

  try {
    const result = await structuredExtraction<{
      headline: string;
      what_changed: string;
      completed_or_removed: string[];
      newly_added: string[];
    }>(
      `You summarize document replacements for project operators.
Return JSON: { "headline": "...", "what_changed": "...", "completed_or_removed": ["..."], "newly_added": ["..."] }
Focus on status changes, completed items, removed risks, and new follow-ups.
Use plain language. No markdown emphasis.`,
      [
        `File: ${fileName}`,
        `Diff stats: ${buildDiffStatsLabel(diff.stats)}`,
        `Removed lines:\n${sampleLines(diff.removals).join('\n') || '(none)'}`,
        `Added lines:\n${sampleLines(diff.additions).join('\n') || '(none)'}`,
      ].join('\n\n'),
      OPENAI_MODELS.summary
    );

    const ai_summary = formatNaturalSummary(
      [result.headline, result.what_changed].filter(Boolean).join(' ')
    );
    const summary = formatNaturalSummary(result.headline || ai_summary);
    return { summary, ai_summary };
  } catch (error) {
    console.warn(
      'Replacement summary fallback:',
      error instanceof Error ? error.message : 'Unknown'
    );
    const summary = buildDiffStatsLabel(diff.stats);
    return {
      summary,
      ai_summary: `Updated ${fileName}. ${summary}.`,
    };
  }
}

export async function finalizeFileReplacement(options: {
  supabase: SupabaseClient;
  projectId: string;
  fileId: string;
  fileName: string;
  newText: string;
  pending: PendingFileReplacement;
  projectName?: string;
}): Promise<ReplacementSummary | null> {
  const { supabase, projectId, fileId, fileName, newText, pending, projectName } = options;
  const previousText = pending.previous_text?.trim() ?? '';

  if (!previousText) {
    return null;
  }

  const diff = computeTextDiff(previousText, newText);
  const { summary, ai_summary } = await summarizeReplacementDiff(fileName, diff);

  const citation: Citation = {
    file_id: fileId,
    file_name: fileName,
    snippet: summary,
  };

  const { data: revision, error: revisionError } = await supabase
    .from('file_revisions')
    .insert({
      project_id: projectId,
      file_id: fileId,
      file_name: fileName,
      summary,
      ai_summary,
      additions: diff.additions,
      removals: diff.removals,
      diff_stats: diff.stats,
      diff_preview: diff.preview,
    })
    .select('id')
    .single();

  if (revisionError || !revision) {
    console.error('Failed to store file revision:', revisionError?.message ?? 'Unknown');
    return { summary, ai_summary, diff };
  }

  await supabase.from('timeline_events').insert({
    project_id: projectId,
    event_type: 'file_replaced',
    title: `Updated: ${fileName}`,
    description: ai_summary,
    source_file_id: fileId,
    metadata: {
      revision_id: revision.id,
      diff_stats: diff.stats,
    },
  });

  await supabase.from('sunny_updates').insert({
    project_id: projectId,
    title: projectName ? `${fileName} updated in ${projectName}` : `${fileName} updated`,
    summary: ai_summary,
    why_it_matters: formatNaturalSummary(buildDiffStatsLabel(diff.stats)),
    suggested_action: formatNaturalSummary('Review the change summary before sending updates.'),
    source_citations: [citation],
  });

  return { summary, ai_summary, diff, revisionId: revision.id };
}

export function readPendingFileReplacement(
  metadata: Record<string, unknown> | null | undefined
): PendingFileReplacement | null {
  const pending = metadata?.pending_replacement;
  if (!pending || typeof pending !== 'object') return null;
  const value = pending as PendingFileReplacement;
  if (typeof value.previous_text !== 'string' || typeof value.replaced_at !== 'string') {
    return null;
  }
  return value;
}
