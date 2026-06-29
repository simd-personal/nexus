import { ALL_PROJECTS_SCOPE, type ChatScope } from '@/lib/chat/scope';
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

export function chatCacheKey(userId: string, mode: string, projectId?: string) {
  return `${userId}:${mode}:${projectId ?? 'all'}`;
}

const STORAGE_PREFIX = 'briefnexus-chat:';
const MESSAGE_CACHE_PREFIX = 'briefnexus-chat-msgs:';
const CHAT_SCOPE_PREFIX = 'briefnexus-chat-scope:';
const LEGACY_SCOPE_PATTERN = /^(search|project|brief|playbook):/;
const persistTimers = new Map<string, ReturnType<typeof setTimeout>>();
const pendingMessageCaches = new Map<string, Record<string, ChatMessage[]>>();

/** Remove pre-user-scoping chat keys so another account on the same browser cannot see them. */
export function purgeLegacyUnscopedChatCaches() {
  if (typeof window === 'undefined') return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key) continue;
      const isLegacyChatKey =
        (key.startsWith(STORAGE_PREFIX) || key.startsWith(MESSAGE_CACHE_PREFIX)) &&
        LEGACY_SCOPE_PATTERN.test(key.slice(key.indexOf(':') + 1));
      if (isLegacyChatKey) keysToRemove.push(key);
    }
    for (const key of keysToRemove) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // private browsing / storage disabled
  }
}

export function purgeAllChatCaches() {
  if (typeof window === 'undefined') return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key) continue;
      if (
        key.startsWith(STORAGE_PREFIX) ||
        key.startsWith(MESSAGE_CACHE_PREFIX) ||
        key.startsWith(CHAT_SCOPE_PREFIX)
      ) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // private browsing / storage disabled
  }
  store.clear();
}

function emptyState(): ChatScopeState {
  return {
    sessions: [],
    messages: [],
    messageCache: {},
    sidebarOpen: false,
    sourceFilter: '',
    modelPreference: 'auto',
  };
}

export function hydrateChatScopeFromStorage(key: string): ChatScopeState {
  const state = getOrInitChatScopeState(key);
  const persistedMessages = loadPersistedMessageCache(key);
  if (Object.keys(persistedMessages).length > 0) {
    state.messageCache = { ...persistedMessages, ...state.messageCache };
  }
  return state;
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

const MAX_CACHED_MESSAGES_PER_SESSION = 80;
const MAX_MESSAGE_CACHE_BYTES = 450_000;

type StoredChatMessage = Pick<
  ChatMessage,
  'id' | 'session_id' | 'role' | 'content' | 'created_at' | 'citations' | 'metadata'
>;

export function normalizeChatMessage(message: Partial<ChatMessage> & Pick<ChatMessage, 'id' | 'role' | 'content'>): ChatMessage {
  return {
    id: message.id,
    session_id: message.session_id ?? '',
    project_id: message.project_id ?? '',
    role: message.role,
    content: message.content,
    created_at: message.created_at ?? new Date().toISOString(),
    citations: message.citations ?? [],
    metadata: message.metadata ?? {},
  };
}

export function normalizeChatMessages(messages: Array<Partial<ChatMessage> & Pick<ChatMessage, 'id' | 'role' | 'content'>>): ChatMessage[] {
  return messages.map((message) => normalizeChatMessage(message));
}

function trimMessageForStorage(message: ChatMessage): StoredChatMessage {
  const artifact = message.metadata?.artifact as { type?: string; title?: string } | undefined;
  const metadata =
    artifact?.type === 'deck'
      ? {
          ...message.metadata,
          artifact: { type: artifact.type, title: artifact.title },
        }
      : message.metadata;

  const contentCap = artifact?.type === 'deck' ? 500 : 12_000;
  const content =
    message.content.length > contentCap
      ? `${message.content.slice(0, contentCap)}\n…`
      : message.content;

  return {
    id: message.id,
    session_id: message.session_id,
    role: message.role,
    content,
    created_at: message.created_at,
    citations: message.citations,
    metadata,
  };
}

export function loadPersistedMessageCache(scopeKey: string): Record<string, ChatMessage[]> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(`${MESSAGE_CACHE_PREFIX}${scopeKey}`);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, StoredChatMessage[]>;
    const result: Record<string, ChatMessage[]> = {};
    for (const [sessionId, rows] of Object.entries(parsed)) {
      result[sessionId] = normalizeChatMessages(rows);
    }
    return result;
  } catch {
    return {};
  }
}

export function persistMessageCache(scopeKey: string, cache: Record<string, ChatMessage[]>) {
  if (typeof window === 'undefined') return;
  try {
    const trimmed: Record<string, StoredChatMessage[]> = {};
    for (const [sessionId, messages] of Object.entries(cache)) {
      trimmed[sessionId] = messages
        .slice(-MAX_CACHED_MESSAGES_PER_SESSION)
        .map(trimMessageForStorage);
    }

    let payload = JSON.stringify(trimmed);
    while (payload.length > MAX_MESSAGE_CACHE_BYTES && Object.keys(trimmed).length > 1) {
      const oldestKey = Object.keys(trimmed)[0];
      delete trimmed[oldestKey];
      payload = JSON.stringify(trimmed);
    }

    window.localStorage.setItem(`${MESSAGE_CACHE_PREFIX}${scopeKey}`, payload);
  } catch {
    // quota exceeded or private browsing
  }
}

export function schedulePersistMessageCache(
  scopeKey: string,
  cache: Record<string, ChatMessage[]>,
  delayMs = 300
) {
  if (typeof window === 'undefined') return;
  pendingMessageCaches.set(scopeKey, cache);
  const existing = persistTimers.get(scopeKey);
  if (existing) clearTimeout(existing);
  persistTimers.set(
    scopeKey,
    setTimeout(() => {
      persistMessageCache(scopeKey, cache);
      persistTimers.delete(scopeKey);
      pendingMessageCaches.delete(scopeKey);
    }, delayMs)
  );
}

export function flushPersistMessageCache(scopeKey: string) {
  const existing = persistTimers.get(scopeKey);
  if (existing) {
    clearTimeout(existing);
    persistTimers.delete(scopeKey);
  }
  const pending = pendingMessageCaches.get(scopeKey);
  if (pending) {
    persistMessageCache(scopeKey, pending);
    pendingMessageCaches.delete(scopeKey);
    return;
  }
  const state = getOrInitChatScopeState(scopeKey);
  persistMessageCache(scopeKey, state.messageCache);
}

export function persistChatScope(userId: string, scope: ChatScope) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(`${CHAT_SCOPE_PREFIX}${userId}`, JSON.stringify(scope));
  } catch {
    // private browsing / storage disabled
  }
}

export function loadChatScope(userId: string): ChatScope | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(`${CHAT_SCOPE_PREFIX}${userId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ChatScope;
    if (parsed.kind === 'all') return ALL_PROJECTS_SCOPE;
    if (parsed.kind === 'selected' && Array.isArray(parsed.projectIds)) {
      return {
        kind: 'selected',
        projectIds: parsed.projectIds,
        labels: Array.isArray(parsed.labels) ? parsed.labels : parsed.projectIds,
      };
    }
    return null;
  } catch {
    return null;
  }
}

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
