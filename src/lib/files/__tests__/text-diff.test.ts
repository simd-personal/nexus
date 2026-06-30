import { describe, expect, it } from 'vitest';
import { buildDiffStatsLabel, computeTextDiff } from '@/lib/files/text-diff';

describe('computeTextDiff', () => {
  it('detects added and removed lines', () => {
    const diff = computeTextDiff(
      'Issue A open\nIssue B open\nIssue C open',
      'Issue A done\nIssue B open\nIssue D open'
    );

    expect(diff.removals.some((line) => line.includes('Issue A open'))).toBe(true);
    expect(diff.removals.some((line) => line.includes('Issue C open'))).toBe(true);
    expect(diff.additions.some((line) => line.includes('Issue A done'))).toBe(true);
    expect(diff.additions.some((line) => line.includes('Issue D open'))).toBe(true);
    expect(diff.stats.lines_unchanged).toBe(1);
    expect(diff.preview).toMatch(/^-/m);
    expect(diff.preview).toMatch(/^\+/m);
  });

  it('reports no changes for identical content', () => {
    const text = 'Issue A open\nIssue B open';
    const diff = computeTextDiff(text, text);
    expect(diff.additions).toHaveLength(0);
    expect(diff.removals).toHaveLength(0);
    expect(buildDiffStatsLabel(diff.stats)).toMatch(/unchanged/);
  });
});
