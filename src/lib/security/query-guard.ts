import type { SupabaseClient } from '@supabase/supabase-js';
import { isSubstantiveSource } from '@/lib/ai/generation-prompts';
import type { RetrievedChunk } from '@/lib/search/retrieve';

/** Minimum cosine similarity for semantic matches before we call the model. */
export const MIN_SEMANTIC_SIMILARITY = 0.55;

export const GUARDRAIL_MESSAGES = {
  offTopic:
    "I'm built for your uploaded client and project materials — I can't help with general questions. Upload documents or ask about what's in your projects.",
  noMaterial:
    'Upload at least one client document (meeting notes, transcript, email, or deck) before chatting with Sunny.',
  lowRelevance:
    "I couldn't find that in your uploaded materials. Try rephrasing or upload more context about this topic.",
} as const;

export type QueryGuardReason = 'off_topic' | 'no_material' | 'low_relevance';

export interface QueryGuardVerdict {
  allowed: boolean;
  reason?: QueryGuardReason;
  message: string;
}

const OFF_TOPIC_PATTERNS: RegExp[] = [
  /\b(write|compose|draft)\s+(me\s+)?(a\s+)?(poem|story|song|essay|joke|rap)\b/i,
  /\bhelp me with (my )?(math|calculus|algebra|physics|chemistry) homework\b/i,
  /\b(what is|who is|who was|when was|where is)\s+(the\s+)?(capital of|president of|meaning of)\b/i,
  /\b(explain|define|describe)\s+(quantum|relativity|string theory|the big bang)\b/i,
  /\b(python|javascript|typescript|java|c\+\+|rust|ruby|golang|sql)\s+(code|function|script|program)\b/i,
  /\b(debug|fix)\s+(this|my)\s+(code|bug|script|program)\b/i,
  /\bignore (all )?(previous|prior|above) instructions\b/i,
  /\byou are now\b/i,
  /\bpretend (to be|you(?:'re| are))\b/i,
  /\b(dan mode|jailbreak|do anything now|developer mode)\b/i,
  /\bwhat (llm|model|ai) are you\b/i,
  /\bwrite (me )?(a )?(python|javascript|java|sql)\b/i,
  /\btranslate .{8,120} (to|into) (spanish|french|german|chinese|japanese|korean|italian)\b/i,
  /\b(recipe for|how to cook|ingredients for)\b/i,
];

/** Product actions and project search — skip the off-topic gate when these match. */
const ON_TOPIC_SIGNAL_PATTERNS: RegExp[] = [
  /\b(brief|playbook|deck|slides|presentation|follow[- ]?up|action items?|vp summary|executive summary|status report|memo)\b/i,
  /\b(create|generate|draft|build|make)\s+(a\s+)?(brief|deck|email|playbook|summary|presentation)\b/i,
  /\b(find|search|show|where|who said|what did|summarize|summary of|tell me about|latest on|update on)\b/i,
  /\b(meeting|client|project|vendor|stakeholder|deadline|risk|decision|budget|timeline|roadmap)\b/i,
  /\b(uploaded|materials|documents|transcript|notes|email thread)\b/i,
];

export function looksLikeOnTopicWork(message: string): boolean {
  const trimmed = message.trim();
  if (!trimmed) return false;
  return ON_TOPIC_SIGNAL_PATTERNS.some((pattern) => pattern.test(trimmed));
}

export function checkOffTopicQuery(message: string): QueryGuardVerdict | null {
  const trimmed = message.trim();
  if (!trimmed || looksLikeOnTopicWork(trimmed)) return null;

  if (OFF_TOPIC_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    return { allowed: false, reason: 'off_topic', message: GUARDRAIL_MESSAGES.offTopic };
  }

  return null;
}

export function passesRelevanceGate(
  results: RetrievedChunk[],
  projectSummary: string | null
): boolean {
  const summary = projectSummary?.trim();
  if (summary && summary.length >= 80) return true;

  const substantive = results.filter((row) =>
    isSubstantiveSource(row.file_name, row.text)
  );
  if (substantive.length === 0) return false;

  const bestSimilarity = Math.max(...substantive.map((row) => row.similarity ?? 0));
  if (bestSimilarity >= MIN_SEMANTIC_SIMILARITY) return true;

  return substantive.some(
    (row) =>
      row.match_reason === 'Keyword match' ||
      row.match_reason === 'File content match' ||
      row.match_reason === 'Semantic match' ||
      (row.rank ?? 0) >= 1
  );
}

export function checkRetrievalRelevance(
  results: RetrievedChunk[],
  projectSummary: string | null
): QueryGuardVerdict | null {
  if (passesRelevanceGate(results, projectSummary)) return null;
  return { allowed: false, reason: 'low_relevance', message: GUARDRAIL_MESSAGES.lowRelevance };
}

export async function projectHasMinimumMaterial(
  supabase: SupabaseClient,
  projectId: string
): Promise<boolean> {
  const [{ data: project }, { count: processedFiles }, { count: chunkCount }] = await Promise.all([
    supabase.from('projects').select('last_summary').eq('id', projectId).maybeSingle(),
    supabase
      .from('files')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .eq('status', 'processed'),
    supabase
      .from('chunks')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', projectId),
  ]);

  if ((project?.last_summary?.trim().length ?? 0) >= 80) return true;
  if ((processedFiles ?? 0) >= 1) return true;
  return (chunkCount ?? 0) >= 3;
}

export async function userHasMinimumMaterial(
  supabase: SupabaseClient,
  userId: string,
  scopedProjectIds?: string[] | null
): Promise<boolean> {
  let projectIds = scopedProjectIds?.filter(Boolean) ?? [];
  if (projectIds.length === 0) {
    const { data: projects } = await supabase.from('projects').select('id').eq('owner_id', userId);
    projectIds = (projects ?? []).map((row) => row.id);
  }
  if (projectIds.length === 0) return false;

  if (projectIds.length === 1) {
    return projectHasMinimumMaterial(supabase, projectIds[0]);
  }

  const checks = await Promise.all(
    projectIds.map((projectId) => projectHasMinimumMaterial(supabase, projectId))
  );
  return checks.some(Boolean);
}

export async function evaluatePreQueryGuard(options: {
  message: string;
  supabase: SupabaseClient;
  userId: string;
  projectId?: string | null;
  scopedProjectIds?: string[] | null;
}): Promise<QueryGuardVerdict> {
  const offTopic = checkOffTopicQuery(options.message);
  if (offTopic) return offTopic;

  const hasMaterial = options.projectId
    ? await projectHasMinimumMaterial(options.supabase, options.projectId)
    : await userHasMinimumMaterial(options.supabase, options.userId, options.scopedProjectIds);

  if (!hasMaterial) {
    return { allowed: false, reason: 'no_material', message: GUARDRAIL_MESSAGES.noMaterial };
  }

  return { allowed: true, message: '' };
}

export const ANSWER_SCOPE_RULE = `Scope rules:
- You ONLY answer questions grounded in the Context below (uploaded client/project materials).
- If the question is general knowledge, personal advice, coding help, or unrelated to the Context, respond EXACTLY: "${GUARDRAIL_MESSAGES.offTopic}"
- Do NOT use outside knowledge to answer when the Context does not support it.
- Every answer must be based on the provided Context.`;
