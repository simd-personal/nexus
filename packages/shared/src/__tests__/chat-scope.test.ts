import { describe, expect, it } from 'vitest';
import {
  ALL_PROJECTS_SCOPE,
  buildChatScope,
  formatScopeSummary,
  projectLabel,
  removeScopeLabel,
  resolveScopeProjectIds,
  scopeFromPortfolio,
} from '../chat-scope';
import type { MobileProjectWithStats } from '../mobile';

function project(
  partial: Partial<MobileProjectWithStats> & Pick<MobileProjectWithStats, 'id'>
): MobileProjectWithStats {
  return {
    client_name: 'Acme',
    project_name: 'Program',
    description: null,
    status: 'healthy',
    last_summary: null,
    last_activity_at: null,
    portfolio: 'work',
    ...partial,
  };
}

const tree: MobileProjectWithStats[] = [
  project({
    id: 'program',
    project_name: 'HQ Relocation',
    sub_projects: [
      project({ id: 'ws-a', project_name: 'Site rollout' }),
      project({ id: 'ws-b', project_name: 'HQ planning' }),
    ],
  }),
  project({ id: 'solo', client_name: 'Beta', project_name: 'Strategy' }),
];

describe('shared chat-scope', () => {
  it('formats project labels', () => {
    expect(projectLabel(tree[1])).toBe('Beta · Strategy');
  });

  it('builds all-projects scope when nothing is checked', () => {
    expect(buildChatScope(tree, new Set())).toEqual(ALL_PROJECTS_SCOPE);
  });

  it('expands a program selection to family ids', () => {
    const scope = buildChatScope(tree, new Set(['program', 'ws-a', 'ws-b']));
    expect(resolveScopeProjectIds(scope)?.sort()).toEqual(['program', 'ws-a', 'ws-b'].sort());
    if (scope.kind === 'selected') {
      expect(scope.labels).toEqual(['Acme · HQ Relocation · all workstreams']);
    }
  });

  it('supports partial workstream selection', () => {
    const scope = buildChatScope(tree, new Set(['ws-a']));
    expect(resolveScopeProjectIds(scope)).toEqual(['ws-a']);
    if (scope.kind === 'selected') {
      expect(scope.labels).toEqual(['Acme · Site rollout']);
    }
  });

  it('builds portfolio scope for work projects', () => {
    const scope = scopeFromPortfolio(tree, 'work');
    expect(scope.kind).toBe('selected');
    if (scope.kind === 'selected') {
      expect(scope.labels).toEqual(['Work projects']);
      expect(scope.projectIds.sort()).toEqual(['program', 'solo', 'ws-a', 'ws-b'].sort());
    }
  });

  it('formats scope summary', () => {
    expect(formatScopeSummary(ALL_PROJECTS_SCOPE)).toBe('All projects');
    const scope = scopeFromPortfolio(tree, 'work');
    expect(formatScopeSummary(scope)).toBe('Work projects');
  });

  it('removes portfolio scope labels', () => {
    const scope = scopeFromPortfolio(tree, 'work');
    expect(removeScopeLabel(tree, scope, 'Work projects')).toEqual(ALL_PROJECTS_SCOPE);
  });
});
