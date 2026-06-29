import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  chatCacheKey,
  flushPersistMessageCache,
  loadChatScope,
  normalizeChatMessage,
  normalizeChatMessages,
  persistChatScope,
  schedulePersistMessageCache,
} from '@/lib/chat/cache';
import { ALL_PROJECTS_SCOPE } from '@/lib/chat/scope';

describe('chatCacheKey', () => {
  it('scopes cache keys to the signed-in user', () => {
    expect(chatCacheKey('user-a', 'search')).toBe('user-a:search:all');
    expect(chatCacheKey('user-b', 'search')).toBe('user-b:search:all');
    expect(chatCacheKey('user-a', 'project', 'proj-1')).toBe('user-a:project:proj-1');
  });

  it('uses different keys for different users on the same mode', () => {
    const userA = chatCacheKey('user-a', 'search');
    const userB = chatCacheKey('user-b', 'search');
    expect(userA).not.toBe(userB);
  });

  it('supports a fixed global search cache bucket', () => {
    expect(chatCacheKey('user-a', 'search', 'global')).toBe('user-a:search:global');
    expect(chatCacheKey('user-a', 'search', 'global')).not.toBe(chatCacheKey('user-a', 'search', 'proj-1'));
  });
});

describe('normalizeChatMessages', () => {
  it('fills missing citations and metadata from cached rows', () => {
    const normalized = normalizeChatMessages([
      {
        id: 'm1',
        role: 'assistant',
        content: 'Answer text',
      },
    ]);

    expect(normalized[0].citations).toEqual([]);
    expect(normalized[0].metadata).toEqual({});
    expect(normalized[0].project_id).toBe('');
  });

  it('preserves existing citations', () => {
    const normalized = normalizeChatMessage({
      id: 'm2',
      role: 'assistant',
      content: 'Answer text',
      citations: [{ file_name: 'notes.md', snippet: 'hello' }],
    });

    expect(normalized.citations).toHaveLength(1);
  });
});

describe('chat scope persistence', () => {
  const storage = new Map<string, string>();

  function stubBrowserStorage() {
    const localStorage = {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
      removeItem: (key: string) => {
        storage.delete(key);
      },
      clear: () => storage.clear(),
      key: () => null,
      length: 0,
    };
    vi.stubGlobal('window', { localStorage });
    vi.stubGlobal('localStorage', localStorage);
  }

  beforeEach(() => {
    storage.clear();
    stubBrowserStorage();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('persists and restores chat scope per user', () => {
    const scope = {
      kind: 'selected' as const,
      projectIds: ['proj-1'],
      labels: ['Acme · Program'],
    };
    persistChatScope('user-a', scope);
    expect(loadChatScope('user-a')).toEqual(scope);
    expect(loadChatScope('user-b')).toBeNull();
  });

  it('round-trips all-projects scope', () => {
    persistChatScope('user-a', ALL_PROJECTS_SCOPE);
    expect(loadChatScope('user-a')).toEqual(ALL_PROJECTS_SCOPE);
  });
});

describe('schedulePersistMessageCache', () => {
  const storage = new Map<string, string>();

  function stubBrowserStorage() {
    const localStorage = {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
      removeItem: (key: string) => {
        storage.delete(key);
      },
      clear: () => storage.clear(),
      key: () => null,
      length: 0,
    };
    vi.stubGlobal('window', { localStorage });
    vi.stubGlobal('localStorage', localStorage);
  }

  beforeEach(() => {
    vi.useFakeTimers();
    storage.clear();
    stubBrowserStorage();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('debounces localStorage writes', () => {
    const cache = {
      s1: [{ id: 'm1', session_id: 's1', project_id: '', role: 'user' as const, content: 'hi', created_at: '', citations: [], metadata: {} }],
    };
    schedulePersistMessageCache('user-a:search:global', cache);
    expect(storage.size).toBe(0);
    vi.advanceTimersByTime(300);
    expect(storage.has('briefnexus-chat-msgs:user-a:search:global')).toBe(true);
  });

  it('flushes pending writes immediately', () => {
    const cache = {
      s1: [{ id: 'm1', session_id: 's1', project_id: '', role: 'user' as const, content: 'hi', created_at: '', citations: [], metadata: {} }],
    };
    schedulePersistMessageCache('user-a:search:global', cache);
    flushPersistMessageCache('user-a:search:global');
    expect(storage.has('briefnexus-chat-msgs:user-a:search:global')).toBe(true);
  });
});
