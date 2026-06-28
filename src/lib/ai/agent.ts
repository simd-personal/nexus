import type { SupabaseClient } from '@supabase/supabase-js';
import { structuredExtraction, OPENAI_MODELS } from './openai';
import {
  askSunny,
  generateSunnyBrief,
  generatePlaybook,
  generateFollowUpEmail,
  generateDeck,
  extractActionItems,
} from './sunny';
import type { Citation, SunnyChatResponse } from '@/types/database';
import { fitChunksToBudget } from './context-budget';
import { buildHistoryNote, formatHistoryForClassification } from '@/lib/chat/memory';

export type SunnyAgentAction =
  | 'answer'
  | 'brief'
  | 'deck'
  | 'playbook'
  | 'follow_up_email'
  | 'action_items'
  | 'vp_summary';

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

interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

interface RunSunnyAgentParams {
  message: string;
  context: RetrievedContext;
  project: { id: string; client_name: string; project_name: string };
  chatHistory: ChatTurn[];
  supabase: SupabaseClient;
}

const AGENT_PERSONA = `You are Sunny, the AI employee in BriefNexus. You can ANSWER questions from project materials OR CREATE things when asked.

Creation triggers (use Claude-backed actions):
- brief / executive brief / status report → brief
- deck / slides / presentation → deck
- playbook / operating plan → playbook
- email / follow-up / draft message → follow_up_email
- action items / todos / track tasks → action_items
- VP summary / exec summary / summarize for leadership → vp_summary

If the user is asking questions, analyzing, comparing, or searching → answer
If refining prior output ("make it shorter", "add risks") use the same create action with updated instructions.`;

export async function classifyIntent(
  message: string,
  chatHistory: ChatTurn[]
): Promise<{
  action: SunnyAgentAction;
  instructions?: string;
  email_version?: 'short' | 'detailed' | 'executive';
}> {
  const historySnippet = formatHistoryForClassification(chatHistory);

  return structuredExtraction<{
    action: SunnyAgentAction;
    instructions?: string;
    email_version?: 'short' | 'detailed' | 'executive';
  }>(
    `${AGENT_PERSONA}\n\nClassify the latest user message. Return JSON: { "action": "...", "instructions": "optional focus/tone/refinement", "email_version": "short|detailed|executive" }`,
    `Recent chat:\n${historySnippet || '(none)'}\n\nLatest message: ${message}`,
    OPENAI_MODELS.extraction
  );
}

function contextAsText(context: RetrievedContext): string {
  return [
    context.projectSummary,
    ...fitChunksToBudget(context.chunks).map((c) => c.text),
  ].filter(Boolean).join('\n\n');
}

export async function runSunnyAgent(params: RunSunnyAgentParams): Promise<SunnyChatResponse> {
  const { message, context, project, chatHistory, supabase } = params;
  const { action, instructions, email_version } = await classifyIntent(message, chatHistory);
  const focus = instructions?.trim() || message;

  if (action === 'answer') {
    const historyNote = buildHistoryNote(chatHistory);
    const response = await askSunny(`${message}${historyNote}`, context);
    return { ...response, model: 'gpt' };
  }

  const hasMaterial = context.chunks.length > 0 || context.projectSummary;
  if (!hasMaterial && action !== 'action_items') {
    return {
      answer: "I'd be happy to create that — upload a meeting note, transcript, email, or deck first so I have material to work from.",
      citations: [],
      confidence: 'low',
      model: 'claude',
    };
  }

  switch (action) {
    case 'brief': {
      const brief = await generateSunnyBrief(context, focus);
      const content = Object.entries(brief)
        .filter(([key]) => key !== 'citations')
        .map(([key, value]) => `## ${key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}\n\n${value}`)
        .join('\n\n');
      const title = `Sunny Brief — ${project.project_name}`;

      await supabase.from('generated_documents').insert({
        project_id: project.id,
        type: 'brief',
        title,
        content,
        citations: brief.citations,
        metadata: { source: 'chat', instructions: focus },
      });

      return {
        answer: `Done — I created an executive brief for ${project.client_name} based on your project materials.`,
        citations: brief.citations,
        confidence: 'high',
        artifact: { type: 'brief', title, content },
        actions_taken: ['Generated executive brief', 'Saved to project documents'],
        model: 'claude',
      };
    }

    case 'deck': {
      const content = await generateDeck(project.project_name, project.client_name, context, focus);
      const title = `Presentation Deck — ${project.client_name}`;

      await supabase.from('generated_documents').insert({
        project_id: project.id,
        type: 'memo',
        title,
        content,
        metadata: { doc_kind: 'deck', source: 'chat', instructions: focus },
      });

      return {
        answer: `Here's your presentation deck for ${project.client_name}. I structured it from the uploaded materials — tell me if you want more slides or a different focus.`,
        citations: [],
        confidence: 'high',
        artifact: { type: 'deck', title, content },
        actions_taken: ['Generated presentation deck', 'Saved to project documents'],
        model: 'claude',
      };
    }

    case 'playbook': {
      const content = await generatePlaybook(project.project_name, project.client_name, context, focus);
      const title = `Operating Playbook — ${project.client_name}`;

      await supabase.from('generated_documents').insert({
        project_id: project.id,
        type: 'playbook',
        title,
        content,
        metadata: { source: 'chat', instructions: focus },
      });

      await supabase.from('timeline_events').insert({
        project_id: project.id,
        event_type: 'playbook',
        title: `Playbook generated via chat`,
        description: project.client_name,
      });

      return {
        answer: `I built an operating playbook for ${project.client_name}. It covers client situation, risks, cadence, and recommended actions.`,
        citations: [],
        confidence: 'high',
        artifact: { type: 'playbook', title, content },
        actions_taken: ['Generated operating playbook', 'Saved to project documents'],
        model: 'claude',
      };
    }

    case 'follow_up_email': {
      const content = await generateFollowUpEmail(
        project.project_name,
        project.client_name,
        context,
        email_version ?? 'detailed',
        focus
      );
      const title = `Follow-Up Email — ${project.client_name}`;

      await supabase.from('generated_documents').insert({
        project_id: project.id,
        type: 'follow_up_email',
        title,
        content,
        metadata: { version: email_version ?? 'detailed', source: 'chat', instructions: focus },
      });

      return {
        answer: `Here's a draft follow-up email for ${project.client_name}. Copy it, edit as needed, or ask me to make it shorter or more executive.`,
        citations: [],
        confidence: 'high',
        artifact: { type: 'follow_up_email', title, content },
        actions_taken: ['Drafted follow-up email', 'Saved to project documents'],
        model: 'claude',
      };
    }

    case 'vp_summary': {
      const brief = await generateSunnyBrief(context, `VP-ready executive summary. ${focus}`);
      const content = `# Executive Summary — ${project.client_name}\n\n${brief.executive_summary}\n\n## What Changed\n${brief.what_changed_recently}\n\n## Critical Items\n${brief.critical_items}\n\n## Recommended Next Steps\n${brief.recommended_next_steps}`;
      const title = `VP Summary — ${project.project_name}`;

      return {
        answer: `Here's a VP-ready summary for ${project.client_name}.`,
        citations: brief.citations,
        confidence: 'high',
        artifact: { type: 'summary', title, content },
        actions_taken: ['Generated VP summary'],
        model: 'claude',
      };
    }

    case 'action_items': {
      const sourceText = contextAsText(context);
      const items = await extractActionItems(sourceText || message, 'chat-request');
      const created: string[] = [];

      for (const item of items.slice(0, 8)) {
        if (!item.title?.trim()) continue;
        const citation: Citation = { file_name: 'Project materials', snippet: item.title };
        await supabase.from('action_items').insert({
          project_id: project.id,
          title: item.title,
          description: item.description,
          owner: item.owner,
          due_date: item.due_date,
          source_citations: [citation],
        });
        created.push(item.title);
      }

      const list = created.length
        ? created.map((t) => `- ${t}`).join('\n')
        : '- No new action items found in the materials.';

      return {
        answer: created.length
          ? `I created ${created.length} action item(s) in this project:\n\n${list}`
          : "I couldn't find clear action items in the uploaded materials. Try uploading a meeting note or transcript first.",
        citations: [],
        confidence: created.length ? 'high' : 'medium',
        artifact: created.length
          ? { type: 'action_items', title: 'Action Items Created', content: list }
          : undefined,
        actions_taken: created.length ? [`Added ${created.length} action items to project`] : undefined,
        model: 'gpt',
      };
    }

    default: {
      const response = await askSunny(message, context);
      return { ...response, model: 'gpt' };
    }
  }
}
