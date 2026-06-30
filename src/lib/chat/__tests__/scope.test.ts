import { describe, expect, it } from 'vitest';
import {
  ALL_PROJECTS_SCOPE,
  buildChatScope,
  checkedIdsFromScope,
  formatScopeSummary,
  getNodeCheckState,
  initialScopeForProject,
  parseProjectIdsFromSearchParams,
  projectLabel,
  removeScopeLabel,
  resolveInitialChatScope,
  resolveScopeProjectIds,
  scopeCacheKeySuffix,
  scopeFromUrlProjects,
  scopesEqual,
  toggleNodeChecked,
} from '@/lib/chat/scope';
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

const tree: ProjectWithStats[] = [
  project({
    id: 'program',
    project_name: 'HQ Relocation',
    sub_projects: [
      project({ id: 'ws-a', project_name: 'Site rollout', parent_project_id: 'program' }),
      project({ id: 'ws-b', project_name: 'HQ planning', parent_project_id: 'program' }),
    ],
    sub_project_count: 2,
  }),
  project({ id: 'solo', client_name: 'Beta', project_name: 'Strategy' }),
];

describe('chat scope', () => {
  it('builds all-projects scope when nothing is checked', () => {
    expect(buildChatScope(tree, new Set())).toEqual(ALL_PROJECTS_SCOPE);
  });

  it('expands a program selection to family ids', () => {
    const scope = buildChatScope(tree, new Set(['program', 'ws-a', 'ws-b']));
    expect(resolveScopeProjectIds(scope)?.sort()).toEqual(['program', 'ws-a', 'ws-b'].sort());
    expect(scope.kind === 'selected' && scope.labels).toEqual(['Acme · HQ Relocation · all workstreams']);
  });

  it('supports partial workstream selection', () => {
    const scope = buildChatScope(tree, new Set(['ws-a']));
    expect(resolveScopeProjectIds(scope)).toEqual(['ws-a']);
    expect(scope.kind === 'selected' && scope.labels).toEqual(['Acme · Site rollout']);
  });

  it('initializes locked scope for a program', () => {
    const scope = initialScopeForProject(tree, 'program');
    expect(resolveScopeProjectIds(scope)?.sort()).toEqual(['program', 'ws-a', 'ws-b'].sort());
  });

  it('toggles a program and its workstreams together', () => {
    const checked = toggleNodeChecked(tree[0], new Set());
    expect(checked.has('program')).toBe(true);
    expect(checked.has('ws-a')).toBe(true);
    expect(checked.has('ws-b')).toBe(true);
    expect(getNodeCheckState(tree[0], checked)).toBe('checked');
  });

  it('restores checked ids from scope', () => {
    const scope = initialScopeForProject(tree, 'program');
    const checked = checkedIdsFromScope(tree, scope);
    expect(checked.has('program')).toBe(true);
    expect(checked.has('ws-a')).toBe(true);
  });

  it('removes a workstream chip from scope', () => {
    const scope = buildChatScope(tree, new Set(['ws-a', 'ws-b']));
    const next = removeScopeLabel(tree, scope, projectLabel(tree[0].sub_projects![0]));
    expect(resolveScopeProjectIds(next)).toEqual(['ws-b']);
  });

  it('formats scope summaries', () => {
    expect(formatScopeSummary(ALL_PROJECTS_SCOPE)).toBe('All projects');
    const scope = buildChatScope(tree, new Set(['solo']));
    expect(formatScopeSummary(scope)).toBe('Beta · Strategy');
    const multi = buildChatScope(tree, new Set(['ws-a', 'solo']));
    expect(formatScopeSummary(multi)).toContain('Beta · Strategy');
  });

  it('parses project ids from URL search params', () => {
    const params = new URLSearchParams('project=legacy-id&projects=ws-a,ws-b&projects=solo');
    expect(parseProjectIdsFromSearchParams(params).sort()).toEqual(
      ['legacy-id', 'ws-a', 'ws-b', 'solo'].sort()
    );
  });

  it('builds scope from URL project ids', () => {
    const scope = scopeFromUrlProjects(tree, ['ws-a', 'solo']);
    expect(resolveScopeProjectIds(scope)?.sort()).toEqual(['solo', 'ws-a'].sort());
  });

  it('labels unknown URL project ids', () => {
    const scope = scopeFromUrlProjects(tree, ['missing-id']);
    expect(scope.kind === 'selected' && scope.labels).toEqual(['missing-id']);
  });

  it('uses stable cache key suffixes', () => {
    expect(scopeCacheKeySuffix(ALL_PROJECTS_SCOPE)).toBe('all');
    const scope = buildChatScope(tree, new Set(['solo', 'ws-a']));
    expect(scopeCacheKeySuffix(scope)).toBe('solo,ws-a');
  });

  it('shows indeterminate state for partial program selection', () => {
    expect(getNodeCheckState(tree[0], new Set(['ws-a']))).toBe('indeterminate');
    expect(getNodeCheckState(tree[0], new Set(['ws-a', 'ws-b', 'program']))).toBe('checked');
  });

  it('initializes workstream-only locked scope', () => {
    const scope = initialScopeForProject(tree, 'ws-a');
    expect(resolveScopeProjectIds(scope)).toEqual(['ws-a']);
    expect(scope.kind === 'selected' && scope.labels).toEqual(['Acme · Site rollout']);
  });

  it('compares scopes without order sensitivity', () => {
    const a = buildChatScope(tree, new Set(['ws-a', 'solo']));
    const b = buildChatScope(tree, new Set(['solo', 'ws-a']));
    expect(scopesEqual(a, b)).toBe(true);
    expect(scopesEqual(a, ALL_PROJECTS_SCOPE)).toBe(false);
  });

  it('resolves initial scope with URL, lock, and persisted priority', () => {
    const persisted = buildChatScope(tree, new Set(['solo']));
    expect(
      resolveInitialChatScope({
        lockScope: true,
        projectId: 'ws-a',
        projects: tree,
        urlProjectIds: ['solo'],
        persistedScope: persisted,
      }).kind
    ).toBe('selected');

    expect(
      resolveInitialChatScope({
        lockScope: false,
        projects: tree,
        urlProjectIds: ['ws-a'],
        persistedScope: persisted,
      })
    ).toEqual(initialScopeForProject(tree, 'ws-a'));

    expect(
      resolveInitialChatScope({
        lockScope: false,
        projects: tree,
        urlProjectIds: [],
        persistedScope: persisted,
      })
    ).toEqual(persisted);

    expect(
      resolveInitialChatScope({
        lockScope: false,
        projects: tree,
        urlProjectIds: [],
        persistedScope: null,
      })
    ).toEqual(ALL_PROJECTS_SCOPE);
  });
});
