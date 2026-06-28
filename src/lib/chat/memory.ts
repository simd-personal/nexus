import type { SupabaseClient } from '@supabase/supabase-js';

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

/** Messages loaded from DB for a session (before the latest user turn is saved). */
export const SESSION_HISTORY_DB_LIMIT = 60;

/** Recent turns included in model prompts. */
export const PROMPT_HISTORY_TURNS = 18;

/** Total characters of conversation history sent to the model. */
export const PROMPT_HISTORY_CHAR_BUDGET = 18_000;

/** Per-turn cap so one deck artifact does not crowd out the rest of the thread. */
export const PROMPT_HISTORY_TURN_CHAR_CAP = 4_000;

export async function loadSessionHistory(
  supabase: SupabaseClient,
  sessionId: string,
  limit = SESSION_HISTORY_DB_LIMIT
): Promise<ChatTurn[]> {
  const { data } = await supabase
    .from('chat_messages')
    .select('role, content')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(limit);

  return (data ?? []) as ChatTurn[];
}

function trimTurnContent(content: string): string {
  const trimmed = content.trim();
  if (trimmed.length <= PROMPT_HISTORY_TURN_CHAR_CAP) return trimmed;
  return `${trimmed.slice(0, PROMPT_HISTORY_TURN_CHAR_CAP)}\n…`;
}

export function formatHistoryForPrompt(
  history: ChatTurn[],
  opts?: {
    excludeLastUser?: boolean;
    maxTurns?: number;
    maxChars?: number;
  }
): string {
  let turns = history;
  if (opts?.excludeLastUser && turns.length && turns[turns.length - 1]?.role === 'user') {
    turns = turns.slice(0, -1);
  }

  turns = turns.slice(-(opts?.maxTurns ?? PROMPT_HISTORY_TURNS));

  const lines: string[] = [];
  let chars = 0;
  const budget = opts?.maxChars ?? PROMPT_HISTORY_CHAR_BUDGET;

  for (const turn of turns) {
    const line = `${turn.role}: ${trimTurnContent(turn.content)}`;
    if (chars + line.length > budget && lines.length > 0) break;
    lines.push(line);
    chars += line.length + 1;
  }

  return lines.join('\n');
}

export function buildHistoryNote(history: ChatTurn[], excludeLastUser = true): string {
  const formatted = formatHistoryForPrompt(history, { excludeLastUser });
  return formatted ? `\n\nRecent conversation:\n${formatted}` : '';
}

/** Compact history for intent classification — more turns, shorter per-turn cap. */
export function formatHistoryForClassification(history: ChatTurn[]): string {
  return history
    .slice(-10)
    .map((m) => `${m.role}: ${m.content.slice(0, 800)}`)
    .join('\n');
}
