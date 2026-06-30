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
  });

  it('ignores blank queries', () => {
    expect(buildGlobalSearchHref('   ')).toBeNull();
  });
});
