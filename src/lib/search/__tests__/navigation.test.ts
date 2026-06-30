import { describe, expect, it } from 'vitest';
import { buildGlobalSearchHref } from '@/lib/search/navigation';

describe('buildGlobalSearchHref', () => {
  it('builds a global search URL for dashboard queries', () => {
    expect(buildGlobalSearchHref('staffing concerns')).toBe('/search?q=staffing+concerns');
  });

  it('scopes search to the active project when provided', () => {
    expect(buildGlobalSearchHref('timeline risks', 'proj-123')).toBe(
      '/search?q=timeline+risks&project=proj-123'
    );
    expect(buildGlobalSearchHref('timeline risks', { projectId: 'proj-123' })).toBe(
      '/search?q=timeline+risks&project=proj-123'
    );
  });

  it('scopes search to the active portfolio when provided', () => {
    expect(buildGlobalSearchHref('budget risks', { portfolio: 'personal' })).toBe(
      '/search?q=budget+risks&portfolio=personal'
    );
  });

  it('prefers project scope over portfolio scope', () => {
    expect(
      buildGlobalSearchHref('budget risks', { projectId: 'proj-123', portfolio: 'personal' })
    ).toBe('/search?q=budget+risks&project=proj-123');
  });

  it('ignores blank queries', () => {
    expect(buildGlobalSearchHref('   ')).toBeNull();
  });
});
