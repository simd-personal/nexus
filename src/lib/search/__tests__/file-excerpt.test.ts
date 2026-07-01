import { describe, expect, it } from 'vitest';
import { excerptFileTextForQuery } from '../file-excerpt';

describe('excerptFileTextForQuery', () => {
  it('returns query-adjacent excerpts from long transcripts', () => {
    const intro = 'A'.repeat(8000);
    const relevant = 'The team confirmed claims will not be held for manual validation after Epic go live.';
    const text = `${intro}\n\n${relevant}\n\n${'B'.repeat(8000)}`;

    const excerpt = excerptFileTextForQuery(text, 'notes.txt', ['claims', 'validation']);

    expect(excerpt).toContain('claims will not be held for manual validation');
    expect(excerpt.length).toBeLessThan(text.length);
  });
});
