import { describe, expect, it } from 'vitest';
import {
  scopeCacheKeySuffix,
  sessionMatchesChatScope,
  storedScopeMatchesChatScope,
} from '@upperdeck/shared/chat-scope';
import { cacheScopeChat, getCachedScopeChat } from '../sunny-chat-cache';
import type { ChatMessage } from '../types';

describe('scope cache helpers', () => {
  it('builds stable cache keys', () => {
    expect(scopeCacheKeySuffix({ kind: 'all' })).toBe('all');
    expect(
      scopeCacheKeySuffix({
        kind: 'selected',
        projectIds: ['b', 'a'],
        labels: ['A', 'B'],
      })
    ).toBe('a,b');
  });

  it('matches stored scope metadata', () => {
    expect(storedScopeMatchesChatScope({ kind: 'all' }, null)).toBe(true);
    expect(
      storedScopeMatchesChatScope(
        { kind: 'selected', projectIds: ['p1'], labels: ['One'] },
        { project_ids: ['p1'] }
      )
    ).toBe(true);
    expect(
      storedScopeMatchesChatScope(
        { kind: 'selected', projectIds: ['p1'], labels: ['One'] },
        { project_ids: ['p2'] }
      )
    ).toBe(false);
  });

  it('matches chat sessions by project id', () => {
    const single = { kind: 'selected' as const, projectIds: ['p1'], labels: ['One'] };
    expect(sessionMatchesChatScope({ project_id: 'p1' }, single)).toBe(true);
    expect(sessionMatchesChatScope({ project_id: 'p2' }, single)).toBe(false);
    expect(sessionMatchesChatScope({ project_id: null }, { kind: 'all' })).toBe(true);
  });
});

describe('sunny chat scope cache', () => {
  it('stores and restores chat state per scope', () => {
    const scopeA = { kind: 'selected' as const, projectIds: ['a1'], labels: ['A'] };
    const scopeB = { kind: 'selected' as const, projectIds: ['b1'], labels: ['B'] };
    const message: ChatMessage = {
      id: 'm1',
      session_id: 's1',
      role: 'user',
      content: 'hello',
      created_at: '2026-01-01T00:00:00Z',
    };

    cacheScopeChat(scopeA, { sessionId: 's1', messages: [message] });
    cacheScopeChat(scopeB, { sessionId: 's2', messages: [] });

    expect(getCachedScopeChat(scopeA)).toEqual({ sessionId: 's1', messages: [message] });
    expect(getCachedScopeChat(scopeB)).toEqual({ sessionId: 's2', messages: [] });
  });
});
