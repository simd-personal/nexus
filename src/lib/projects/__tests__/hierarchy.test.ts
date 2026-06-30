import { describe, expect, it } from 'vitest';
import { getProjectFamilyIds, nestProjectsWithStats } from '@/lib/projects/hierarchy';
import type { ProjectWithStats } from '@/types/database';

function project(partial: Partial<ProjectWithStats> & Pick<ProjectWithStats, 'id'>): ProjectWithStats {
  return {
    owner_id: 'user-1',
    organization_id: null,
    client_name: 'Acme',
    project_name: 'Program',
    description: null,
    status: 'healthy',
    last_summary: null,
    last_activity_at: null,
    inbound_token: null,
    parent_project_id: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    file_count: 0,
    meeting_count: 0,
    email_count: 0,
    action_item_count: 0,
    critical_item_count: 0,
    last_sunny_update: null,
    watch_keywords: [],
    my_role: null,
    portfolio: 'work',
    ...partial,
  };
}

describe('project hierarchy', () => {
  it('nests sub-projects under top-level programs', () => {
    const roots = nestProjectsWithStats([
      project({ id: 'parent', project_name: 'Epic', last_activity_at: '2026-06-01T00:00:00Z' }),
      project({ id: 'child-a', project_name: 'Site A', parent_project_id: 'parent' }),
      project({ id: 'child-b', project_name: 'Site B', parent_project_id: 'parent' }),
    ]);

    expect(roots).toHaveLength(1);
    expect(roots[0].id).toBe('parent');
    expect(roots[0].sub_projects?.map((item) => item.id)).toEqual(['child-a', 'child-b']);
    expect(roots[0].sub_project_count).toBe(2);
  });

  it('returns family ids for program roll-up', () => {
    expect(
      getProjectFamilyIds(
        { id: 'parent', parent_project_id: null },
        [{ id: 'child-a' }, { id: 'child-b' }]
      )
    ).toEqual(['parent', 'child-a', 'child-b']);

    expect(getProjectFamilyIds({ id: 'child-a', parent_project_id: 'parent' }, [])).toEqual(['child-a']);
  });
});
