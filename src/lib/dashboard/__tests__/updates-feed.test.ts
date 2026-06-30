import { describe, expect, it } from 'vitest';
import { dashboardUpdatesFeedChanged } from '@/lib/dashboard/updates-feed';
import type { SunnyUpdate } from '@/types/database';

function update(id: string): SunnyUpdate {
  return {
    id,
    project_id: 'proj-1',
    title: `Update ${id}`,
    summary: 'Summary',
    why_it_matters: null,
    suggested_action: null,
    source_citations: [],
    created_at: '2026-01-01T00:00:00Z',
  };
}

describe('dashboardUpdatesFeedChanged', () => {
  it('detects newly arrived sunny updates', () => {
    const result = dashboardUpdatesFeedChanged(
      { updates: [update('u1')], indexingActive: true },
      { updates: [update('u2'), update('u1')], indexingActive: true }
    );

    expect(result.hasNewUpdates).toBe(true);
    expect(result.indexingFinished).toBe(false);
  });

  it('detects when indexing finishes without new update ids yet', () => {
    const result = dashboardUpdatesFeedChanged(
      { updates: [], indexingActive: true },
      { updates: [], indexingActive: false }
    );

    expect(result.hasNewUpdates).toBe(false);
    expect(result.indexingFinished).toBe(true);
  });

  it('ignores unchanged feeds', () => {
    const current = { updates: [update('u1')], indexingActive: false };
    const result = dashboardUpdatesFeedChanged(current, current);

    expect(result.hasNewUpdates).toBe(false);
    expect(result.indexingFinished).toBe(false);
  });
});

describe('buildDashboardUpdatesFeedUrl', () => {
  it('includes portfolio and limit params', async () => {
    const { buildDashboardUpdatesFeedUrl } = await import('@/lib/dashboard/updates-feed');
    expect(buildDashboardUpdatesFeedUrl('personal', 5)).toBe(
      '/api/dashboard/updates?portfolio=personal&limit=5'
    );
  });
});
