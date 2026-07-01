import { describe, expect, it } from 'vitest';
import { buildGlobalSearchHref } from '@/lib/search/navigation';

describe('buildGlobalSearchHref', () => {
  it('builds a global Ask Sunny URL for dashboard queries', () => {
    expect(buildGlobalSearchHref('staffing concerns')).toBe('/sunny?q=staffing+concerns');
  });

  it('scopes search to the active project when provided', () => {
    expect(buildGlobalSearchHref('timeline risks', 'proj-123')).toBe(
      '/sunny?q=timeline+risks&project=proj-123'
    );
    expect(buildGlobalSearchHref('timeline risks', { projectId: 'proj-123' })).toBe(
      '/sunny?q=timeline+risks&project=proj-123'
    );
  });

  it('scopes search to the active portfolio when provided', () => {
    expect(buildGlobalSearchHref('budget risks', { portfolio: 'personal' })).toBe(
      '/sunny?q=budget+risks&portfolio=personal'
    );
    expect(buildGlobalSearchHref('budget risks', { portfolio: 'all' })).toBe(
      '/sunny?q=budget+risks&portfolio=all'
    );
  });

  it('prefers project scope over portfolio scope', () => {
    expect(
      buildGlobalSearchHref('budget risks', { projectId: 'proj-123', portfolio: 'personal' })
    ).toBe('/sunny?q=budget+risks&project=proj-123');
  });

  it('ignores blank queries', () => {
    expect(buildGlobalSearchHref('   ')).toBeNull();
  });
});
