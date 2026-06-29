import { describe, expect, it } from 'vitest';
import { extractMentionSnippet } from '@/lib/entities/mentions';

describe('extractMentionSnippet', () => {
  it('centers the snippet on a case-insensitive match', () => {
    const text = 'The team met with Aaron about the Roseville expansion plan.';
    expect(extractMentionSnippet(text, 'Aaron', 10)).toBe(
      '…met with Aaron about the…'
    );
  });

  it('adds leading ellipsis when truncated at the start', () => {
    const text = 'prefix ' + 'x'.repeat(200) + ' Matt ' + 'y'.repeat(200);
    const snippet = extractMentionSnippet(text, 'Matt', 20);
    expect(snippet.startsWith('…')).toBe(true);
    expect(snippet).toContain('Matt');
  });

  it('adds trailing ellipsis when truncated at the end', () => {
    const text = 'y'.repeat(200) + ' Matt ' + 'z'.repeat(200);
    const snippet = extractMentionSnippet(text, 'Matt', 20);
    expect(snippet.endsWith('…')).toBe(true);
    expect(snippet).toContain('Matt');
  });

  it('returns the full text when shorter than twice the radius and no match', () => {
    expect(extractMentionSnippet('short note', 'missing', 120)).toBe('short note');
  });
});
