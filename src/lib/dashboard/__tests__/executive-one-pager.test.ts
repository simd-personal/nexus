import { describe, expect, it } from 'vitest';
import {
  listDashboardProjectOptions,
  resolveExecutiveOnePagerProjectIds,
} from '../executive-one-pager';
import type { ProjectWithStats } from '@/types/database';

function project(partial: Partial<ProjectWithStats> & Pick<ProjectWithStats, 'id'>): ProjectWithStats {
  return {
    client_name: 'Acme',
    project_name: 'Program',
    description: null,
    status: 'healthy',
    last_summary: null,
    last_activity_at: null,
    parent_project_id: null,
    watch_keywords: [],
    my_role: null,
    portfolio: 'work',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    file_count: 0,
    meeting_count: 0,
    email_count: 0,
    action_item_count: 0,
    critical_item_count: 0,
    last_sunny_update: null,
    ...partial,
  };
}

describe('listDashboardProjectOptions', () => {
  it('includes top-level and nested workstreams', () => {
    const options = listDashboardProjectOptions([
      project({
        id: 'parent',
        sub_projects: [project({ id: 'child', project_name: 'Phase 1' })],
      }),
    ]);

    expect(options.map((option) => option.id)).toEqual(['parent', 'child']);
    expect(options[1]?.label).toBe('Acme · Phase 1');
  });
});

describe('resolveExecutiveOnePagerProjectIds', () => {
  it('returns every project in view for all selection', () => {
    const projects = [
      project({ id: 'a' }),
      project({ id: 'b', client_name: 'Home', portfolio: 'personal' }),
    ];

    expect(resolveExecutiveOnePagerProjectIds(projects, 'all')).toEqual(['a', 'b']);
    expect(resolveExecutiveOnePagerProjectIds(projects, 'b')).toEqual(['b']);
  });
});
