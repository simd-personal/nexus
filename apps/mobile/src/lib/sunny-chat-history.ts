import {
  primaryProjectIdForScope,
  storedScopeMatchesChatScope,
  type ChatScope,
} from '@upperdeck/shared/chat-scope';
import { fetchChatSession, fetchSearchChatSessions } from './api';
import { cacheScopeChat, getCachedScopeChat, type ScopeChatState } from './sunny-chat-cache';
import type { ChatMessage } from './types';

function readStoredScope(message: ChatMessage): { project_ids?: string[] } | null {
  const metadata = message.metadata as { scope?: { project_ids?: string[] } } | undefined;
  return metadata?.scope ?? null;
}

export async function fetchScopeChatHistory(scope: ChatScope): Promise<ScopeChatState> {
  const cached = getCachedScopeChat(scope);
  if (cached?.messages.length) return cached;

  const projectId = primaryProjectIdForScope(scope);
  const { sessions } = await fetchSearchChatSessions(projectId);

  for (const session of sessions) {
    if (projectId && session.project_id && session.project_id !== projectId) continue;

    const { messages } = await fetchChatSession(session.id);
    const firstUser = messages.find((message) => message.role === 'user');
    const storedScope = firstUser ? readStoredScope(firstUser) : null;

    if (scope.kind === 'all') {
      if (session.project_id) continue;
      if (storedScope?.project_ids?.length) continue;
    } else if (!storedScopeMatchesChatScope(scope, storedScope)) {
      continue;
    }

    return { sessionId: session.id, messages };
  }

  return { sessionId: undefined, messages: [] };
}

export async function loadScopeChatHistory(scope: ChatScope): Promise<ScopeChatState> {
  const restored = await fetchScopeChatHistory(scope);
  cacheScopeChat(scope, restored);
  return restored;
}
