import { describe, expect, it } from 'vitest';
import { computeProjectStatus } from '@/lib/projects/health';

describe('computeProjectStatus', () => {
  it('returns healthy when no open critical items', () => {
    expect(computeProjectStatus([])).toBe('healthy');
  });

  it('returns critical when any open item is high or critical severity', () => {
    expect(computeProjectStatus([{ severity: 'medium' }, { severity: 'high' }])).toBe('critical');
  });

  it('returns watch for medium or low open items only', () => {
    expect(computeProjectStatus([{ severity: 'medium' }])).toBe('watch');
  });

  it('returns needs_review when files failed processing', () => {
    expect(computeProjectStatus([], { hasFailedFiles: true })).toBe('needs_review');
  });
});
