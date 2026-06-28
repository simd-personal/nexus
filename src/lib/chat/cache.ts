import type { ChatMessage, ChatSession, ModelPreference } from '@/types/database';

export interface ChatScopeState {
  sessions: ChatSession[];
  sessionsFetchedAt?: number;
  activeSessionId?: string;
  messages: ChatMessage[];
  messageCache: Record<string, ChatMessage[]>;
  sidebarOpen: boolean;
  sourceFilter: string;
  modelPreference: ModelPreference;
}

const SESSIONS_CACHE_MS = 5 * 60 * 1000;
const store = new Map<string, ChatScopeState>();

export function chatCacheKey(mode: string, projectId?: string) {
  return `${mode}:${projectId ?? 'all'}`;
}

function emptyState(): ChatScopeState {
  return {
    sessions: [],
    messages: [],
    messageCache: {},
    sidebarOpen: true,
    sourceFilter: '',
    modelPreference: 'auto',
  };
}

export function getChatScopeState(key: string): ChatScopeState | undefined {
  return store.get(key);
}

export function getOrInitChatScopeState(key: string): ChatScopeState {
  let state = store.get(key);
  if (!state) {
    state = emptyState();
    store.set(key, state);
  }
  return state;
}

export function patchChatScopeState(key: string, patch: Partial<ChatScopeState>) {
  const state = getOrInitChatScopeState(key);
  Object.assign(state, patch);
}

export function sessionsCacheFresh(key: string): boolean {
  const state = store.get(key);
  if (!state?.sessionsFetchedAt) return false;
  return Date.now() - state.sessionsFetchedAt < SESSIONS_CACHE_MS;
}

export function dedupeSessions(sessions: ChatSession[]): ChatSession[] {
  const seen = new Map<string, ChatSession>();

  for (const session of sessions) {
    const title = (session.title ?? '').trim().toLowerCase();
    const key = title && title !== 'new conversation' ? title : session.id;
    const existing = seen.get(key);
    if (!existing || new Date(session.updated_at) > new Date(existing.updated_at)) {
      seen.set(key, session);
    }
  }

  return [...seen.values()].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
}

const STORAGE_PREFIX = 'briefnexus-chat:';

export function loadPersistedActiveSession(scopeKey: string): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    return window.localStorage.getItem(`${STORAGE_PREFIX}${scopeKey}:active`) ?? undefined;
  } catch {
    return undefined;
  }
}

export function persistActiveSession(scopeKey: string, sessionId?: string) {
  if (typeof window === 'undefined') return;
  try {
    const key = `${STORAGE_PREFIX}${scopeKey}:active`;
    if (sessionId) window.localStorage.setItem(key, sessionId);
    else window.localStorage.removeItem(key);
  } catch {
    // private browsing / storage disabled
  }
}
