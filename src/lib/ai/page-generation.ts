/**
 * GPT generation for project pages (/api/generate) — outside chat.
 * Output is natural prose with no asterisks or dashes.
 */
import { streamLongForm as streamClaudeLongForm, CLAUDE_MODELS } from '@/lib/ai/claude';
import { isOpenAIUnavailable } from '@/lib/ai/errors';
import { chatCompletion, generateLongForm, streamLongForm, structuredExtraction, OPENAI_MODELS } from '@/lib/ai/openai';
import { resolveEngine } from '@/lib/ai/stream-agent';
import {
  BRIEF_SYSTEM_PROMPT,
  EMAIL_SYSTEM_PROMPT,
  EXECUTIVE_ONE_PAGER_PROMPT,
  PAGE_DECK_PROMPT,
  PLAYBOOK_SYSTEM_PROMPT,
  PROSE_STYLE_GUIDE,
  filterSubstantiveChunks,
  formatNaturalProse,
} from '@/lib/ai/generation-prompts';
import type { Citation, ModelEngine, ModelPreference, SunnyBrief } from '@/types/database';
import { buildHistoryNote, type ChatTurn } from '@/lib/chat/memory';

export interface PageGenerationContext {
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

const SUNNY_PERSONA = `You are Sunny, the AI employee inside UpperDeck. You act like an internal team member who has read every client meeting, email, deck, note, transcript, and file. You speak in clear, executive-friendly language. You never make unsupported claims. If the evidence is insufficient, say: "Not enough evidence in the uploaded materials."`;

function formatContext(ctx: PageGenerationContext): string {
  const parts: string[] = [];
  if (ctx.projectSummary) parts.push(`Project summary:\n${ctx.projectSummary}`);
  if (ctx.criticalItems.length) {
    parts.push(
      'Critical items:\n' +
        ctx.criticalItems.map((c) => `${c.title} (${c.severity}): ${c.summary}`).join('\n')
    );
  }
  if (ctx.chunks.length) {
    parts.push(
      'Source materials:\n' +
        ctx.chunks.map((c) => `(${c.source_type ?? 'document'}) ${c.file_name}:\n${c.text}`).join('\n\n')
    );
  }
  return parts.join('\n\n');
}

function buildCitations(ctx: PageGenerationContext): Citation[] {
  return ctx.chunks.slice(0, 5).map((c) => ({
    file_id: c.metadata?.file_id as string | undefined,
    file_name: c.file_name,
    source_type: c.source_type as Citation['source_type'],
    snippet: c.text.slice(0, 200),
  }));
}

const BRIEF_SECTION_LABELS: Record<string, string> = {
  executive_summary: 'Executive Summary',
  what_changed_recently: 'What Changed Recently',
  critical_items: 'Critical Items',
  client_concerns: 'Client Concerns',
  risks: 'Risks',
  opportunities: 'Opportunities',
  people_mentioned: 'People Mentioned',
  facilities_mentioned: 'Facilities Mentioned',
  open_action_items: 'Open Action Items',
  contradictions: 'Contradictions',
  recommended_next_steps: 'Recommended Next Steps',
};

function sanitizeBriefFields(brief: Omit<SunnyBrief, 'citations'>): Omit<SunnyBrief, 'citations'> {
  return Object.fromEntries(
    Object.entries(brief).map(([key, value]) => [key, formatNaturalProse(String(value ?? ''))])
  ) as Omit<SunnyBrief, 'citations'>;
}

export function formatBriefAsProse(brief: Omit<SunnyBrief, 'citations'>): string {
  return Object.entries(brief)
    .map(([key, value]) => {
      const label = BRIEF_SECTION_LABELS[key] ?? key;
      return `${label}\n\n${value}`;
    })
    .join('\n\n');
}

/** ChatGPT — executive brief for project Brief page */
export async function generatePageBrief(
  context: PageGenerationContext,
  instructions?: string
): Promise<SunnyBrief> {
  const userPrompt = [
    `Evidence:\n${formatContext(context)}`,
    instructions?.trim() ? `\nUser instructions:\n${instructions.trim()}` : '',
    '\nReturn JSON with keys: executive_summary, what_changed_recently, critical_items, client_concerns, risks, opportunities, people_mentioned, facilities_mentioned, open_action_items, contradictions, recommended_next_steps',
    'For any section without evidence, write "Not enough evidence in the uploaded materials."',
    'Never include citation numbers, bracket references, markdown headings, or bullet lists in any field.',
    `\nAll string values must follow:\n${PROSE_STYLE_GUIDE}`,
  ].join('');

  const result = await structuredExtraction<Omit<SunnyBrief, 'citations'>>(
    `${SUNNY_PERSONA}\n\n${BRIEF_SYSTEM_PROMPT}`,
    userPrompt,
    OPENAI_MODELS.generationHigh,
    { reasoningEffort: 'high' }
  );

  const sanitized = sanitizeBriefFields(result);
  return { ...sanitized, citations: buildCitations(context) };
}

/** ChatGPT — operating playbook for project Playbook page */
export async function generatePagePlaybook(
  projectName: string,
  clientName: string,
  context: PageGenerationContext,
  instructions?: string
): Promise<string> {
  const raw = await generateLongForm(
    `${SUNNY_PERSONA}\n\n${PLAYBOOK_SYSTEM_PROMPT}`,
    [
      `Client: ${clientName}\nProject: ${projectName}\n\nEvidence:\n${formatContext(context)}`,
      instructions?.trim() ? `\nUser instructions:\n${instructions.trim()}` : '',
    ].join(''),
    OPENAI_MODELS.generation
  );
  return formatNaturalProse(raw);
}

/** ChatGPT — follow up email for project Follow Up page */
export async function generatePageFollowUpEmail(
  projectName: string,
  clientName: string,
  context: PageGenerationContext,
  version: 'short' | 'detailed' | 'executive' = 'detailed',
  instructions?: string
): Promise<string> {
  const versionGuide = {
    short: 'Keep it to 3 or 4 sentences.',
    detailed: 'Include key discussion points and clear next steps in 2 or 3 paragraphs.',
    executive: 'Write for a senior executive audience. Concise and strategic, no sales language.',
  };

  const raw = await generateLongForm(
    `${SUNNY_PERSONA}\n\n${EMAIL_SYSTEM_PROMPT}\n\n${versionGuide[version]}`,
    [
      `Client: ${clientName}\nProject: ${projectName}\n\nEvidence:\n${formatContext(context)}`,
      instructions?.trim() ? `\nUser instructions:\n${instructions.trim()}` : '',
    ].join(''),
    OPENAI_MODELS.generation
  );
  return formatNaturalProse(raw);
}

/** ChatGPT — quick executive one-pager for dashboard updates */
export async function generatePageExecutiveOnePager(
  projectName: string,
  clientName: string,
  context: PageGenerationContext,
  instructions?: string
): Promise<string> {
  const raw = await generateLongForm(
    `${SUNNY_PERSONA}\n\n${EXECUTIVE_ONE_PAGER_PROMPT}`,
    [
      `Client: ${clientName}\nProject: ${projectName}\n\nEvidence:\n${formatContext(context)}`,
      instructions?.trim() ? `\nUser instructions:\n${instructions.trim()}` : '',
    ].join(''),
    OPENAI_MODELS.generation
  );
  return formatNaturalProse(raw);
}

/** ChatGPT — presentation content for project Deck page (prose, not chat slide markdown) */
export async function generatePageDeck(
  projectName: string,
  clientName: string,
  context: PageGenerationContext,
  instructions?: string
): Promise<string> {
  const filtered = {
    ...context,
    chunks: filterSubstantiveChunks(context.chunks),
  };

  const raw = await generateLongForm(
    `${SUNNY_PERSONA}\n\n${PAGE_DECK_PROMPT}`,
    [
      `Client: ${clientName}\nProject: ${projectName}\n\nEvidence:\n${formatContext(filtered)}`,
      instructions?.trim() ? `\nUser instructions:\n${instructions.trim()}` : '',
    ].join(''),
    OPENAI_MODELS.generation
  );
  return formatNaturalProse(raw);
}

function buildPageChatPrompt(
  context: PageGenerationContext,
  message: string,
  history: ChatTurn[],
  extra?: string
): string {
  const historyNote = buildHistoryNote(history);
  return [
    extra ?? '',
    `Evidence:\n${formatContext(context)}`,
    historyNote,
    `\nLatest request:\n${message.trim()}`,
  ]
    .filter(Boolean)
    .join('\n\n');
}

async function streamWithEngine(
  engine: ModelEngine,
  systemPrompt: string,
  userPrompt: string,
  onToken: (token: string) => void,
  options?: { highReasoning?: boolean; claudeModel?: string }
): Promise<{ text: string; engine: ModelEngine }> {
  const claudeModel = options?.claudeModel ?? CLAUDE_MODELS.brief;
  const runClaude = () => streamClaudeLongForm(systemPrompt, userPrompt, onToken, claudeModel);
  const runGpt = () =>
    streamLongForm(
      systemPrompt,
      userPrompt,
      onToken,
      options?.highReasoning ? OPENAI_MODELS.generationHigh : OPENAI_MODELS.generation,
      options?.highReasoning ? { reasoningEffort: 'high' } : undefined
    );

  try {
    if (engine === 'claude') {
      return { text: await runClaude(), engine: 'claude' };
    }
    return { text: await runGpt(), engine: 'gpt' };
  } catch (error) {
    if (engine === 'gpt' && isOpenAIUnavailable(error)) {
      console.warn('[openai] Page generation unavailable — falling back to Claude');
      return { text: await runClaude(), engine: 'claude' };
    }
    throw error;
  }
}

/** Streaming executive brief for Sunny Brief page chat */
export async function streamPageBrief(
  context: PageGenerationContext,
  message: string,
  history: ChatTurn[],
  onToken: (token: string) => void,
  preference?: ModelPreference
): Promise<{ content: string; citations: Citation[]; model: ModelEngine }> {
  const engine = resolveEngine(preference, 'create');
  const userPrompt = buildPageChatPrompt(context, message, history);
  const { text, engine: usedEngine } = await streamWithEngine(
    engine,
    `${SUNNY_PERSONA}\n\n${BRIEF_SYSTEM_PROMPT}\n\nWrite a complete executive brief with clear section titles and prose paragraphs. Cover executive summary, what changed recently, critical items, client concerns, risks, opportunities, open action items, and recommended next steps.`,
    userPrompt,
    onToken,
    { highReasoning: true }
  );
  return { content: formatNaturalProse(text), citations: buildCitations(context), model: usedEngine };
}

/** Streaming operating playbook for Playbook page chat */
export async function streamPagePlaybook(
  projectName: string,
  clientName: string,
  context: PageGenerationContext,
  message: string,
  history: ChatTurn[],
  onToken: (token: string) => void,
  preference?: ModelPreference
): Promise<{ content: string; model: ModelEngine }> {
  const engine = resolveEngine(preference, 'create');
  const userPrompt = buildPageChatPrompt(
    context,
    message,
    history,
    `Client: ${clientName}\nProject: ${projectName}`
  );
  const { text, engine: usedEngine } = await streamWithEngine(
    engine,
    `${SUNNY_PERSONA}\n\n${PLAYBOOK_SYSTEM_PROMPT}`,
    userPrompt,
    onToken,
    { claudeModel: CLAUDE_MODELS.playbook }
  );
  return { content: formatNaturalProse(text), model: usedEngine };
}

/** ChatGPT — one paragraph project summary refresh (optional utility) */
export async function generatePageSummary(text: string, fileName: string): Promise<string> {
  const raw = await chatCompletion(
    `${SUNNY_PERSONA}\n\nSummarize in 2 or 3 executive sentences.\n\n${PROSE_STYLE_GUIDE}`,
    `File: ${fileName}\n\n${text.slice(0, 6000)}`,
    OPENAI_MODELS.summary
  );
  return formatNaturalProse(raw);
}
