import { describe, expect, it } from 'vitest';
import {
  chatCacheKey,
  normalizeChatMessage,
  normalizeChatMessages,
} from '@/lib/chat/cache';

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
