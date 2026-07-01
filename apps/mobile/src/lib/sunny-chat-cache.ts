import { scopeCacheKeySuffix, type ChatScope } from '@upperdeck/shared/chat-scope';
import type { ChatMessage } from './types';

export type ScopeChatState = {
  sessionId?: string;
  messages: ChatMessage[];
};

const scopeChatStore = new Map<string, ScopeChatState>();

export function getCachedScopeChat(scope: ChatScope): ScopeChatState | undefined {
  return scopeChatStore.get(scopeCacheKeySuffix(scope));
}

export function cacheScopeChat(scope: ChatScope, state: ScopeChatState): void {
  scopeChatStore.set(scopeCacheKeySuffix(scope), {
    sessionId: state.sessionId,
    messages: state.messages,
  });
}
