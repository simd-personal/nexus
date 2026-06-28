import { describe, expect, it } from 'vitest';
import {
  buildHistoryNote,
  formatHistoryForPrompt,
  PROMPT_HISTORY_CHAR_BUDGET,
  PROMPT_HISTORY_TURN_CHAR_CAP,
} from '@/lib/chat/memory';

describe('chat memory formatting', () => {
  it('includes many recent turns within the character budget', () => {
    const history = Array.from({ length: 20 }, (_, i) => ({
      role: i % 2 === 0 ? ('user' as const) : ('assistant' as const),
      content: `Turn ${i} with project context about Denver expansion and vendor consolidation.`,
    }));

    const formatted = formatHistoryForPrompt(history, { excludeLastUser: false });
    expect(formatted.split('\n').length).toBeGreaterThanOrEqual(12);
    expect(formatted).toContain('Turn 19');
  });

  it('caps an oversized assistant turn so the thread stays balanced', () => {
    const history = [
      { role: 'user' as const, content: 'Summarize the HILO action plans' },
      { role: 'assistant' as const, content: 'A'.repeat(PROMPT_HISTORY_TURN_CHAR_CAP + 500) },
    ];

    const formatted = formatHistoryForPrompt(history);
    expect(formatted.length).toBeLessThan(PROMPT_HISTORY_CHAR_BUDGET + 200);
    expect(formatted).toContain('…');
  });

  it('builds a history note and excludes the latest user turn by default', () => {
    const note = buildHistoryNote([
      { role: 'user', content: 'First question' },
      { role: 'assistant', content: 'First answer' },
      { role: 'user', content: 'Follow up question' },
    ]);

    expect(note).toContain('First question');
    expect(note).toContain('First answer');
    expect(note).not.toContain('Follow up question');
  });
});
