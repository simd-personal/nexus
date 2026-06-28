import type { SupabaseClient } from '@supabase/supabase-js';
import { streamChatCompletion, OPENAI_MODELS } from './openai';
import { streamLongForm, CLAUDE_MODELS } from './claude';
import { classifyIntent, type SunnyAgentAction } from './agent';
import { extractActionItems } from './sunny';
import {
  BRIEF_SYSTEM_PROMPT,
  DECK_SYSTEM_PROMPT,
  EMAIL_SYSTEM_PROMPT,
  PLAYBOOK_SYSTEM_PROMPT,
  PROSE_STYLE_GUIDE,
  filterSubstantiveChunks,
} from './generation-prompts';
import type {
  Citation,
  ModelEngine,
  ModelPreference,
  SunnyChatArtifact,
  SunnyChatResponse,
} from '@/types/database';

const SUNNY_PERSONA = `You are Sunny, the AI employee inside BriefNexus. You act like an internal team member who has read every client meeting, email, deck, note, transcript, and file. You speak in clear, executive-friendly language. You never make unsupported claims. If the evidence is insufficient, say: "Not enough evidence in the uploaded materials." Always cite your sources when answering questions.`;

const SEARCH_STREAM_PERSONA = `${SUNNY_PERSONA}

Adapt your response to what the user asked. Be direct and thorough.

${PROSE_STYLE_GUIDE}`;

/**
 * Picks the engine for a task given the user's preference.
 * Auto routes Q&A to ChatGPT and generation to Claude; an explicit
 * preference forces that model for every task.
 */
export function resolveEngine(
  preference: ModelPreference | undefined,
  task: 'answer' | 'create'
): ModelEngine {
  if (preference === 'gpt') return 'gpt';
  if (preference === 'claude') return 'claude';
  return task === 'create' ? 'claude' : 'gpt';
}

export interface AgentStreamContext {
  chunks: Array<{ text: string; file_name: string; source_type?: string; metadata?: Record<string, unknown> }>;
  criticalItems: Array<{ title: string; summary: string; severity: string }>;
  timelineEvents: Array<{ title: string; description: string | null; created_at: string }>;
  projectSummary: string | null;
}

function formatContext(ctx: AgentStreamContext): string {
  const parts: string[] = [];
  if (ctx.projectSummary) parts.push(`## Project Summary\n${ctx.projectSummary}`);
  if (ctx.criticalItems.length) {
    parts.push('## Critical Items\n' + ctx.criticalItems.map((c) => `- [${c.severity}] ${c.title}: ${c.summary}`).join('\n'));
  }
  if (ctx.chunks.length) {
    parts.push('## Source Materials\n' + ctx.chunks.map((c, i) =>
      `[${i + 1}] (${c.source_type ?? 'document'}) ${c.file_name}:\n${c.text}`
    ).join('\n\n'));
  }
  return parts.join('\n\n');
}

function buildCitations(ctx: AgentStreamContext): Citation[] {
  return ctx.chunks.slice(0, 5).map((c) => ({
    file_name: c.file_name,
    source_type: c.source_type as Citation['source_type'],
    snippet: c.text.slice(0, 200),
  }));
}

function contextAsText(context: AgentStreamContext): string {
  return [context.projectSummary, ...context.chunks.map((c) => c.text)].filter(Boolean).join('\n\n');
}

export async function streamSearchAnswer(
  query: string,
  context: AgentStreamContext,
  onToken: (token: string) => void,
  options?: { scopeInstruction?: string | null; engine?: ModelEngine }
): Promise<Pick<SunnyChatResponse, 'citations' | 'confidence' | 'model'>> {
  const engine = options?.engine ?? 'gpt';

  if (context.chunks.length === 0 && !context.projectSummary) {
    const msg = 'Not enough evidence in the uploaded materials.';
    for (const char of msg) onToken(char);
    return { citations: [], confidence: 'low', model: engine };
  }

  const scopeNote = options?.scopeInstruction ? `\n\n${options.scopeInstruction}` : '';
  const system = `${SEARCH_STREAM_PERSONA}${scopeNote}`;
  const userPrompt = `Context:\n${formatContext(context)}\n\nUser query: ${query}`;

  if (engine === 'claude') {
    await streamLongForm(system, userPrompt, onToken, CLAUDE_MODELS.brief);
  } else {
    await streamChatCompletion(system, userPrompt, onToken, OPENAI_MODELS.chat);
  }

  return { citations: buildCitations(context), confidence: 'high', model: engine };
}

export type CreateAction = Exclude<SunnyAgentAction, 'answer'>;

export function isCreateAction(action: SunnyAgentAction): action is CreateAction {
  return action !== 'answer';
}

interface ClassifiedIntent {
  action: SunnyAgentAction;
  instructions?: string;
  email_version?: 'short' | 'detailed' | 'executive';
}

export async function classifyChatIntent(
  message: string,
  chatHistory: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<ClassifiedIntent> {
  return classifyIntent(message, chatHistory);
}

interface StreamAgentParams {
  message: string;
  context: AgentStreamContext;
  project: { id: string; client_name: string; project_name: string };
  chatHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  onStatus: (message: string) => void;
  onToken: (token: string) => void;
  supabase: SupabaseClient;
  modelPreference?: ModelPreference;
}

export async function runSunnyAgentStream(params: StreamAgentParams): Promise<SunnyChatResponse> {
  const { message, context, project, chatHistory, onStatus, onToken, supabase, modelPreference } = params;

  onStatus('Understanding your request...');
  const { action, instructions, email_version } = await classifyIntent(message, chatHistory);

  if (action === 'answer') {
    onStatus('Searching project materials...');
    const historyNote = chatHistory.length
      ? `\n\nRecent conversation:\n${chatHistory.slice(-4).map((m) => `${m.role}: ${m.content}`).join('\n')}`
      : '';
    const engine = resolveEngine(modelPreference, 'answer');
    const meta = await streamSearchAnswer(`${message}${historyNote}`, context, onToken, { engine });
    return { answer: '', citations: meta.citations, confidence: meta.confidence, model: meta.model };
  }

  return executeCreateStream({
    action,
    message,
    instructions,
    email_version,
    context,
    project,
    onStatus,
    onToken,
    supabase,
    engine: resolveEngine(modelPreference, 'create'),
  });
}

interface ExecuteCreateParams {
  action: CreateAction;
  message: string;
  instructions?: string;
  email_version?: 'short' | 'detailed' | 'executive';
  context: AgentStreamContext;
  project: { id: string; client_name: string; project_name: string };
  onStatus: (message: string) => void;
  onToken: (token: string) => void;
  supabase: SupabaseClient;
  engine?: ModelEngine;
}

export async function executeCreateStream(params: ExecuteCreateParams): Promise<SunnyChatResponse> {
  const { action, message, instructions, email_version, context, project, onStatus, onToken, supabase } = params;
  const engine = params.engine ?? 'claude';
  const focus = instructions?.trim() || message;

  const substantiveChunks = filterSubstantiveChunks(context.chunks);
  const filteredContext = { ...context, chunks: substantiveChunks };
  const hasMaterial = substantiveChunks.length > 0 || context.projectSummary;
  if (!hasMaterial && action !== 'action_items') {
    const msg = "I'd be happy to create that — upload a meeting note, transcript, email, or deck first so I have material to work from.";
    for (const char of msg) onToken(char);
    return { answer: msg, citations: [], confidence: 'low', model: engine };
  }

  const engineLabel = engine === 'gpt' ? 'ChatGPT' : 'Claude';
  onStatus(`Creating with ${engineLabel}...`);
  const ctxText = formatContext(filteredContext);
  let content = '';
  let artifact: SunnyChatArtifact | undefined;
  let actions_taken: string[] | undefined;
  const citations = buildCitations(filteredContext);

  const claudeCreate = async (
    system: string,
    user: string,
    model: string = CLAUDE_MODELS.playbook
  ) =>
    engine === 'gpt'
      ? streamChatCompletion(system, user, onToken, OPENAI_MODELS.summary)
      : streamLongForm(system, user, onToken, model);

  switch (action) {
    case 'brief': {
      content = await claudeCreate(
        `${BRIEF_SYSTEM_PROMPT}\n\nSections: Executive Summary, What Changed Recently, Critical Items, Client Concerns, Risks, Opportunities, People Mentioned, Open Action Items, Recommended Next Steps.`,
        `Client: ${project.client_name}\nProject: ${project.project_name}\n\nEvidence:\n${ctxText}\n\nInstructions: ${focus}`,
        CLAUDE_MODELS.brief
      );
      const title = `Sunny Brief — ${project.project_name}`;
      artifact = { type: 'brief', title, content };
      actions_taken = ['Generated executive brief', 'Saved to project documents'];
      await supabase.from('generated_documents').insert({
        project_id: project.id, type: 'brief', title, content, citations,
        metadata: { source: 'chat', instructions: focus },
      });
      break;
    }
    case 'deck': {
      content = await claudeCreate(
        DECK_SYSTEM_PROMPT,
        `Client: ${project.client_name}\nProject: ${project.project_name}\n\nEvidence:\n${ctxText}\n\nInstructions: ${focus}`,
        CLAUDE_MODELS.deck
      );
      const title = `Presentation Deck — ${project.client_name}`;
      artifact = { type: 'deck', title, content };
      actions_taken = ['Generated presentation deck', 'Saved to project documents'];
      await supabase.from('generated_documents').insert({
        project_id: project.id, type: 'memo', title, content,
        metadata: { doc_kind: 'deck', source: 'chat', instructions: focus },
      });
      break;
    }
    case 'playbook': {
      content = await claudeCreate(
        PLAYBOOK_SYSTEM_PROMPT,
        `Client: ${project.client_name}\nProject: ${project.project_name}\n\nEvidence:\n${ctxText}\n\nInstructions: ${focus}`,
        CLAUDE_MODELS.playbook
      );
      const title = `Operating Playbook — ${project.client_name}`;
      artifact = { type: 'playbook', title, content };
      actions_taken = ['Generated operating playbook', 'Saved to project documents'];
      await supabase.from('generated_documents').insert({
        project_id: project.id, type: 'playbook', title, content,
        metadata: { source: 'chat', instructions: focus },
      });
      break;
    }
    case 'follow_up_email': {
      const version = email_version ?? 'detailed';
      content = await claudeCreate(
        `${EMAIL_SYSTEM_PROMPT}\n\nVersion: ${version}.`,
        `Client: ${project.client_name}\nProject: ${project.project_name}\n\nEvidence:\n${ctxText}\n\nInstructions: ${focus}`,
        CLAUDE_MODELS.memo
      );
      const title = `Follow-Up Email — ${project.client_name}`;
      artifact = { type: 'follow_up_email', title, content };
      actions_taken = ['Drafted follow-up email', 'Saved to project documents'];
      await supabase.from('generated_documents').insert({
        project_id: project.id, type: 'follow_up_email', title, content,
        metadata: { version, source: 'chat', instructions: focus },
      });
      break;
    }
    case 'vp_summary': {
      content = await claudeCreate(
        `${SUNNY_PERSONA}\n\nWrite a VP-ready executive summary in markdown.\n\n${STYLE_GUIDE}`,
        `Client: ${project.client_name}\n\nEvidence:\n${ctxText}\n\nInstructions: ${focus}`,
        CLAUDE_MODELS.brief
      );
      artifact = { type: 'summary', title: `VP Summary — ${project.project_name}`, content };
      actions_taken = ['Generated VP summary'];
      break;
    }
    case 'action_items': {
      onStatus('Extracting action items...');
      const items = await extractActionItems(contextAsText(context) || message, 'chat-request');
      const created: string[] = [];
      for (const item of items.slice(0, 8)) {
        if (!item.title?.trim()) continue;
        await supabase.from('action_items').insert({
          project_id: project.id,
          title: item.title,
          description: item.description,
          owner: item.owner,
          due_date: item.due_date,
          source_citations: [{ file_name: 'Project materials', snippet: item.title }],
        });
        created.push(item.title);
      }
      const list = created.length ? created.map((t) => `- ${t}`).join('\n') : 'No action items found.';
      content = created.length
        ? `I created ${created.length} action item(s):\n\n${list}`
        : "I couldn't find clear action items in the uploaded materials.";
      for (const char of content) onToken(char);
      if (created.length) {
        artifact = { type: 'action_items', title: 'Action Items Created', content: list };
        actions_taken = [`Added ${created.length} action items to project`];
      }
      return { answer: content, citations: [], confidence: created.length ? 'high' : 'medium', artifact, actions_taken, model: 'gpt' };
    }
    default: {
      onStatus('Searching project materials...');
      const meta = await streamSearchAnswer(message, context, onToken, { engine });
      return { answer: '', citations: meta.citations, confidence: meta.confidence, model: meta.model };
    }
  }

  return {
    answer: content,
    citations,
    confidence: 'high',
    artifact,
    actions_taken,
    model: engine,
  };
}
