import { chatCompletion, structuredExtraction, OPENAI_MODELS } from './openai';
import { generateLongForm, generateStructured, CLAUDE_MODELS } from './claude';
import { isOpenAIUnavailable } from '@/lib/ai/errors';
import {
  DECK_SYSTEM_PROMPT,
  STYLE_GUIDE,
  PROSE_STYLE_GUIDE,
  filterSubstantiveChunks,
  formatNaturalProse,
  formatNaturalSummary,
} from './generation-prompts';
import type { Citation, SunnyBrief, SunnyChatResponse } from '@/types/database';
import { sampleTextForAnalysis } from '@/lib/processing/text-sampling';
import { fitChunksToBudget } from '@/lib/ai/context-budget';

const SUNNY_PERSONA = `You are Sunny, the AI employee inside UpperDeck. You act like an internal team member who has read every client meeting, email, deck, note, transcript, and file. You speak in clear, executive-friendly language. You never make unsupported claims. If the evidence is insufficient, say: "Not enough evidence in the uploaded materials." Always cite your sources.`;

const SEARCH_PERSONA = `${SUNNY_PERSONA}

You power UpperDeck search (ChatGPT). Adapt every answer to what the user actually asked.
When they say find, where, or show me, lead with location and source file names.
When they ask for everything or a summary, give a comprehensive answer in prose.
For person, facility, or topic questions, focus on every mention with context.
For comparison or contradiction questions, call out differences explicitly.
For vague or broad queries, cover all relevant projects and materials found.

${PROSE_STYLE_GUIDE}`;

interface RetrievedContext {
  chunks: Array<{
    text: string;
    file_name: string;
    source_type?: string;
    metadata?: Record<string, unknown>;
  }>;
  criticalItems: Array<{ title: string; summary: string; severity: string }>;
  timelineEvents: Array<{ title: string; description: string | null; created_at: string }>;
  projectSummary: string | null;
}

function formatContext(ctx: RetrievedContext): string {
  const parts: string[] = [];

  if (ctx.projectSummary) {
    parts.push(`## Project Summary\n${ctx.projectSummary}`);
  }

  if (ctx.criticalItems.length) {
    parts.push('## Critical Items\n' + ctx.criticalItems.map((c) =>
      `- [${c.severity}] ${c.title}: ${c.summary}`
    ).join('\n'));
  }

  if (ctx.timelineEvents.length) {
    parts.push('## Recent Timeline\n' + ctx.timelineEvents.map((e) =>
      `- ${e.created_at}: ${e.title}${e.description ? '. ' + e.description : ''}`
    ).join('\n'));
  }

  if (ctx.chunks.length) {
    const chunks = fitChunksToBudget(ctx.chunks);
    parts.push('## Source Materials\n' + chunks.map((c, i) =>
      `[${i + 1}] (${c.source_type ?? 'document'}) ${c.file_name}:\n${c.text}`
    ).join('\n\n'));
  }

  return parts.join('\n\n');
}

function buildCitations(ctx: RetrievedContext): Citation[] {
  return fitChunksToBudget(ctx.chunks).slice(0, 8).map((c) => ({
    file_id: c.metadata?.file_id as string | undefined,
    file_name: c.file_name,
    source_type: c.source_type as Citation['source_type'],
    snippet: c.text.slice(0, 200),
    page_number: c.metadata?.page_number as number | undefined,
    sender: c.metadata?.sender as string | undefined,
    date: c.metadata?.date as string | undefined,
  }));
}

/** OpenAI — project Q&A (Ask Sunny tab) */
export async function askSunny(
  question: string,
  context: RetrievedContext
): Promise<SunnyChatResponse> {
  return answerFromContext(question, context, SEARCH_PERSONA);
}

/** OpenAI — global and project search */
export async function searchAnswer(
  query: string,
  context: RetrievedContext
): Promise<SunnyChatResponse> {
  return answerFromContext(query, context, SEARCH_PERSONA);
}

async function answerFromContext(
  question: string,
  context: RetrievedContext,
  persona: string
): Promise<SunnyChatResponse> {
  if (context.chunks.length === 0 && !context.projectSummary) {
    return {
      answer: 'Not enough evidence in the uploaded materials.',
      citations: [],
      confidence: 'low',
    };
  }

  const contextText = formatContext(context);
  const system = `${persona}\n\nAnswer using ONLY the provided context. Match the user's intent and phrasing. Return JSON with: answer, confidence, suggested_next_step (optional), citation_indices (array of source numbers used).`;
  const user = `Context:\n${contextText}\n\nUser query: ${question}`;

  let result: {
    answer: string;
    confidence: 'high' | 'medium' | 'low';
    suggested_next_step?: string;
    citation_indices: number[];
  };

  try {
    result = await structuredExtraction(system, user, OPENAI_MODELS.chat);
  } catch (error) {
    if (!isOpenAIUnavailable(error)) throw error;
    console.warn('[openai] Search answer unavailable — falling back to Claude');
    const text = await generateLongForm(
      `${persona}\n\nAnswer using ONLY the provided context. Match the user's intent and phrasing.`,
      user,
      CLAUDE_MODELS.brief
    );
    result = {
      answer: text,
      confidence: 'high',
      citation_indices: buildCitations(context).map((_, i) => i + 1).slice(0, 3),
    };
  }

  const citations = (result.citation_indices ?? [])
    .map((i) => buildCitations(context)[i - 1])
    .filter(Boolean);

  return {
    answer: formatNaturalProse(result.answer),
    citations: citations.length ? citations : buildCitations(context).slice(0, 3),
    confidence: result.confidence,
    suggested_next_step: result.suggested_next_step
      ? formatNaturalProse(result.suggested_next_step)
      : undefined,
  };
}

/** Claude — executive brief generation */
export async function generateSunnyBrief(
  context: RetrievedContext,
  instructions?: string
): Promise<SunnyBrief> {
  const contextText = formatContext(context);
  const userPrompt = [
    `Evidence:\n${contextText}`,
    instructions?.trim() ? `\nUser instructions:\n${instructions.trim()}` : '',
    '\nReturn JSON with keys: executive_summary, what_changed_recently, critical_items, client_concerns, risks, opportunities, people_mentioned, facilities_mentioned, open_action_items, contradictions, recommended_next_steps',
    'For any section without evidence, write "Not enough evidence in the uploaded materials."',
  ].join('');

  const result = await generateStructured<Omit<SunnyBrief, 'citations'>>(
    `${SUNNY_PERSONA}\n\nGenerate an executive brief grounded ONLY in the evidence. Adapt tone and emphasis to the user's instructions when provided.`,
    userPrompt,
    CLAUDE_MODELS.brief
  );

  return {
    ...result,
    citations: buildCitations(context),
  };
}

export async function detectCriticalItems(
  newContent: string,
  existingContent: string,
  fileName: string
): Promise<Array<{
  title: string;
  summary: string;
  severity: string;
  category: string;
  sunny_reasoning: string;
  suggested_owner?: string;
  suggested_next_action?: string;
}>> {
  const result = await structuredExtraction<{ items: Array<{
    title: string;
    summary: string;
    severity: string;
    category: string;
    sunny_reasoning: string;
    suggested_owner?: string;
    suggested_next_action?: string;
  }> }>(
    `${SUNNY_PERSONA}\n\nAnalyze the new content against existing project materials. Detect: client risks, contradictions, missed follow-ups, urgent concerns, ownership gaps, timeline conflicts, and broken processes. Only flag items with clear evidence. Return JSON: { "items": [...] } with severity (low/medium/high/critical) and category (conflict/risk/missed_follow_up/client_concern/ownership_gap/timeline_issue/broken_process).\n\nFor summary, sunny_reasoning, and suggested_next_action fields:\n${PROSE_STYLE_GUIDE}`,
    `New content from "${fileName}":\n${sampleTextForAnalysis(newContent, fileName, 6000)}\n\nExisting project context:\n${existingContent.slice(0, 6000)}`,
    OPENAI_MODELS.criticalDetection
  );

  return (result.items ?? []).map((item) => ({
    ...item,
    summary: formatNaturalSummary(item.summary),
    sunny_reasoning: formatNaturalSummary(item.sunny_reasoning),
    suggested_next_action: item.suggested_next_action
      ? formatNaturalSummary(item.suggested_next_action)
      : item.suggested_next_action,
  }));
}

export async function extractEntities(text: string, fileName = 'document'): Promise<Array<{
  type: string;
  name: string;
}>> {
  const result = await structuredExtraction<{ entities: Array<{ type: string; name: string }> }>(
    'Extract named entities from the text. Return JSON: { "entities": [{ "type": "person|facility|organization|topic|date", "name": "..." }] }',
    sampleTextForAnalysis(text, fileName, 8000),
    OPENAI_MODELS.extraction
  );
  return result.entities ?? [];
}

export type ActionItemKind = 'commitment' | 'decision' | 'informational' | 'risk';
export type ActionItemConfidence = 'high' | 'medium' | 'low';

export interface NormalizedActionItem {
  title: string;
  description?: string;
  owner?: string;
  due_date?: string;
  item_kind?: ActionItemKind;
  applies_to_me?: boolean;
  matched_terms?: string[];
  confidence?: ActionItemConfidence;
}

export interface ActionItemExtractionContext {
  watchlistPrompt: string;
  sourceType?: string;
}

const ACTION_TITLE_KEYS = [
  'title',
  'action',
  'task',
  'item',
  'text',
  'name',
  'summary',
  'action_item',
  'follow_up',
  'followup',
];
const ACTION_OWNER_KEYS = ['owner', 'assignee', 'assigned_to', 'responsible', 'owner_name'];
const ACTION_DESC_KEYS = ['description', 'details', 'context', 'notes'];
const ACTION_DUE_KEYS = ['due_date', 'due', 'deadline', 'date', 'target_date'];

function pickStringField(obj: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return undefined;
}

/** Normalize GPT extraction output — models often use action/task instead of title. */
export function normalizeActionItems(raw: unknown): NormalizedActionItem[] {
  if (!Array.isArray(raw)) return [];

  const items: NormalizedActionItem[] = [];
  for (const entry of raw) {
    if (typeof entry === 'string') {
      const title = entry.trim();
      if (title) items.push({ title });
      continue;
    }
    if (!entry || typeof entry !== 'object') continue;

    const obj = entry as Record<string, unknown>;
    const title = pickStringField(obj, ACTION_TITLE_KEYS);
    if (!title) continue;

    const itemKind = pickStringField(obj, ['item_kind', 'kind', 'type']);
    const confidence = pickStringField(obj, ['confidence']);
    const appliesRaw = obj.applies_to_me;
    const matchedRaw = obj.matched_terms;

    items.push({
      title,
      description: pickStringField(obj, ACTION_DESC_KEYS),
      owner: pickStringField(obj, ACTION_OWNER_KEYS),
      due_date: pickStringField(obj, ACTION_DUE_KEYS),
      item_kind: isActionItemKind(itemKind) ? itemKind : undefined,
      applies_to_me: typeof appliesRaw === 'boolean' ? appliesRaw : undefined,
      matched_terms: Array.isArray(matchedRaw)
        ? matchedRaw.filter((term): term is string => typeof term === 'string' && term.trim().length > 0)
        : undefined,
      confidence: isActionItemConfidence(confidence) ? confidence : undefined,
    });
  }
  return items;
}

function isActionItemKind(value: string | undefined): value is ActionItemKind {
  return value === 'commitment' || value === 'decision' || value === 'informational' || value === 'risk';
}

function isActionItemConfidence(value: string | undefined): value is ActionItemConfidence {
  return value === 'high' || value === 'medium' || value === 'low';
}

export async function extractActionItems(
  text: string,
  fileName: string,
  context?: ActionItemExtractionContext
): Promise<NormalizedActionItem[]> {
  const watchlistSection = context?.watchlistPrompt
    ? `\n\nAccount watchlist (only surface items relevant to this person or these terms):\n${context.watchlistPrompt}`
    : '';

  const result = await structuredExtraction<{
    action_items?: unknown;
    items?: unknown;
    tasks?: unknown;
  }>(
    `Extract follow-ups from the text that are relevant to the account holder or their watchlist terms.
${watchlistSection}

Rules:
- Skip background updates, other people's tasks, and pure FYI unless they require follow-up from the account holder.
- item_kind must be one of: commitment, decision, informational, risk
- applies_to_me: true only when the account holder (or their company/role) should act or was explicitly assigned
- matched_terms: watchlist terms that appear in the item (empty array if none)
- confidence: high | medium | low — use low for vague mentions

Return JSON only:
{
  "action_items": [
    {
      "title": "Sim to send Epic cutover timeline",
      "description": "optional context",
      "owner": "Sim Patel",
      "due_date": "2025-06-28",
      "item_kind": "commitment",
      "applies_to_me": true,
      "matched_terms": ["Sim", "Epic"],
      "confidence": "high"
    }
  ]
}
Every item MUST have a non-empty "title" string. Do not use "action", "task", or other keys instead of "title".`,
    `From "${fileName}":\n${sampleTextForAnalysis(text, fileName, 12000)}`,
    OPENAI_MODELS.extraction
  );

  const raw = result.action_items ?? result.items ?? result.tasks ?? [];
  return normalizeActionItems(raw);
}

export async function summarizeContent(text: string, fileName: string): Promise<string> {
  const raw = await chatCompletion(
    `${SUNNY_PERSONA}\n\nSummarize this content in 2-3 executive-friendly sentences.\n\n${PROSE_STYLE_GUIDE}`,
    `File: ${fileName}\n\n${sampleTextForAnalysis(text, fileName, 12000)}`,
    OPENAI_MODELS.summary
  );
  return formatNaturalSummary(raw);
}

export async function generateSunnyUpdate(
  projectName: string,
  changes: string
): Promise<{ title: string; summary: string; why_it_matters: string; suggested_action: string }> {
  const result = await structuredExtraction<{
    title: string;
    summary: string;
    why_it_matters: string;
    suggested_action: string;
  }>(
    `${SUNNY_PERSONA}\n\nGenerate a Sunny update for the VP. Return JSON with title, summary, why_it_matters, suggested_action.\n\nDo not include file names, page numbers, or a Sources line in any field. Source documents are stored separately.\n\nFor summary, why_it_matters, and suggested_action:\n${PROSE_STYLE_GUIDE}`,
    `Project: ${projectName}\n\nChanges:\n${changes}`,
    OPENAI_MODELS.summary
  );

  return {
    title: result.title,
    summary: formatNaturalSummary(result.summary),
    why_it_matters: formatNaturalSummary(result.why_it_matters),
    suggested_action: formatNaturalSummary(result.suggested_action),
  };
}

export async function generateBatchSunnyUpdate(
  projectName: string,
  files: Array<{
    fileName: string;
    status: string;
    summary: string;
    criticalCount: number;
  }>
): Promise<{ title: string; summary: string; why_it_matters: string; suggested_action: string }> {
  const fileBriefs = files
    .map(
      (file) =>
        `- ${file.fileName} (${file.status})${file.criticalCount > 0 ? ` — ${file.criticalCount} critical item(s)` : ''}\n  ${file.summary || 'No extractable summary.'}`
    )
    .join('\n');

  const result = await structuredExtraction<{
    title: string;
    summary: string;
    why_it_matters: string;
    suggested_action: string;
  }>(
    `${SUNNY_PERSONA}\n\nThe user uploaded ${files.length} files at once. Write ONE consolidated Sunny update for the VP — not separate updates per file. Synthesize cross-file themes, conflicts, and gaps. Return JSON with title, summary, why_it_matters, suggested_action.\n\nDo not include file names, page numbers, or a Sources line in any field. Source documents are stored separately.\n\nFor summary, why_it_matters, and suggested_action:\n${PROSE_STYLE_GUIDE}`,
    `Project: ${projectName}\n\nFiles reviewed:\n${fileBriefs}`,
    OPENAI_MODELS.summary
  );

  return {
    title: result.title,
    summary: formatNaturalSummary(result.summary),
    why_it_matters: formatNaturalSummary(result.why_it_matters),
    suggested_action: formatNaturalSummary(result.suggested_action),
  };
}

/** ChatGPT — project setup when user creates a project */
export async function enrichProjectSetup(input: {
  clientName: string;
  projectName: string;
  description?: string;
  userNotes?: string;
}): Promise<{ description: string; initial_summary: string }> {
  const userPrompt = [
    `Client: ${input.clientName}`,
    `Project: ${input.projectName}`,
    input.description ? `Description: ${input.description}` : '',
    input.userNotes ? `User notes (follow these closely): ${input.userNotes}` : '',
    '\nReturn JSON: { "description": "...", "initial_summary": "..." }',
    'description: 1-2 sentences expanding what this project is about.',
    'initial_summary: what Sunny should track and watch for based on the user input.',
  ].filter(Boolean).join('\n');

  const result = await structuredExtraction<{ description: string; initial_summary: string }>(
    `${SUNNY_PERSONA}\n\nHelp set up a new client project. Adapt to whatever the user provided — industry, goals, concerns, timeline, stakeholders. If details are sparse, infer sensible defaults without inventing client-specific facts.\n\nFor initial_summary:\n${PROSE_STYLE_GUIDE}`,
    userPrompt,
    OPENAI_MODELS.summary
  );

  return {
    description: formatNaturalSummary(result.description),
    initial_summary: formatNaturalSummary(result.initial_summary),
  };
}

/** Claude — operating playbook */
export async function generatePlaybook(
  projectName: string,
  clientName: string,
  context: RetrievedContext,
  instructions?: string
): Promise<string> {
  const contextText = formatContext(context);

  return generateLongForm(
    `${SUNNY_PERSONA}\n\nGenerate a comprehensive client operating playbook grounded ONLY in the provided evidence. Include: Client Situation Overview, What the Client Cares About, Key Problems, Operational Risks, Facility/Client Concerns, Recommended Operating Playbook, Follow-up Cadence, Owner/Action Table, Executive Talking Points, Client Follow-up Strategy, and Source-Backed Rationale. Use markdown formatting. If evidence is missing for a section, state it clearly. Adapt structure and emphasis to the user's instructions.`,
    [
      `Client: ${clientName}\nProject: ${projectName}\n\nEvidence:\n${contextText}`,
      instructions?.trim() ? `\nUser instructions:\n${instructions.trim()}` : '',
    ].join(''),
    CLAUDE_MODELS.playbook
  );
}

/** Claude — follow-up email */
export async function generateFollowUpEmail(
  projectName: string,
  clientName: string,
  context: RetrievedContext,
  version: 'short' | 'detailed' | 'executive' = 'detailed',
  instructions?: string
): Promise<string> {
  const contextText = formatContext(context);
  const versionGuide = {
    short: 'Keep it to 3-4 sentences.',
    detailed: 'Include key discussion points and clear next steps in 2-3 paragraphs.',
    executive: 'Write for a senior executive audience. Concise, strategic, no sales language.',
  };

  return generateLongForm(
    `${SUNNY_PERSONA}\n\nDraft a professional follow-up email. ${versionGuide[version]} Ground every claim in the evidence. Do not be salesy. Adapt tone and content to the user's instructions.`,
    [
      `Client: ${clientName}\nProject: ${projectName}\n\nEvidence:\n${contextText}`,
      instructions?.trim() ? `\nUser instructions:\n${instructions.trim()}` : '',
    ].join(''),
    CLAUDE_MODELS.memo
  );
}

/** Claude — presentation deck outline / content */
export async function generateDeck(
  projectName: string,
  clientName: string,
  context: RetrievedContext,
  instructions?: string
): Promise<string> {
  const filtered = {
    ...context,
    chunks: filterSubstantiveChunks(context.chunks),
  };
  const contextText = formatContext(filtered);

  return generateLongForm(
    DECK_SYSTEM_PROMPT,
    [
      `Client: ${clientName}\nProject: ${projectName}\n\nEvidence:\n${contextText}`,
      instructions?.trim() ? `\nUser instructions:\n${instructions.trim()}` : '',
    ].join(''),
    CLAUDE_MODELS.deck
  );
}

/** @deprecated use searchAnswer */
export async function globalSearchAnswer(
  query: string,
  context: RetrievedContext
): Promise<SunnyChatResponse> {
  return searchAnswer(query, context);
}
