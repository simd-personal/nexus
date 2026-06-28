import { describe, expect, it } from 'vitest';
import { fitChunksToBudget, CONTEXT_CHUNK_CHAR_BUDGET } from '@/lib/ai/context-budget';

describe('context budget', () => {
  it('keeps as many chunks as fit under the char budget', () => {
    const chunks = Array.from({ length: 30 }, (_, i) => ({
      text: `Chunk ${i} `.repeat(120),
    }));

    const fitted = fitChunksToBudget(chunks);
    expect(fitted.length).toBeGreaterThan(10);
    expect(fitted.length).toBeLessThanOrEqual(22);

    const totalChars = fitted.reduce((sum, c) => sum + c.text.length, 0);
    expect(totalChars).toBeLessThanOrEqual(CONTEXT_CHUNK_CHAR_BUDGET + 5000);
  });

  it('includes at least one chunk even when the first chunk is very large', () => {
    const fitted = fitChunksToBudget([{ text: 'X'.repeat(CONTEXT_CHUNK_CHAR_BUDGET + 1000) }]);
    expect(fitted).toHaveLength(1);
    expect(fitted[0].text.length).toBe(CONTEXT_CHUNK_CHAR_BUDGET);
  });
});
