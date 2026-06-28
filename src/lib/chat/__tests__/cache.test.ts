import { describe, expect, it } from 'vitest';
import { normalizeChatMessage, normalizeChatMessages } from '@/lib/chat/cache';

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
