import { describe, expect, it } from 'vitest';
import {
  ALL_PROJECTS_SCOPE,
  buildChatScope,
  checkedIdsFromScope,
  formatScopeSummary,
  getPortfolioCheckState,
  initialScopeForProject,
  projectLabel,
  normalizeProjectPortfolios,
  removeScopeLabel,
  resolveScopeProjectIds,
  scopeFromPortfolio,
  splitProjectsByPortfolio,
  toggleNodeChecked,
  togglePortfolioChecked,
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

const mixedPortfolios: MobileProjectWithStats[] = [
  ...tree,
  project({ id: 'personal-1', client_name: 'Home', project_name: 'Renovation', portfolio: 'personal' }),
  project({ id: 'personal-2', client_name: 'Home', project_name: 'Garden', portfolio: 'personal' }),
];

describe('shared chat-scope', () => {
  it('builds initial scope for a single project', () => {
    const scope = initialScopeForProject(tree, 'solo');
    expect(resolveScopeProjectIds(scope)).toEqual(['solo']);
    if (scope.kind === 'selected') {
      expect(scope.labels).toEqual(['Beta · Strategy']);
    }
  });

  it('expands program scope to all workstreams', () => {
    const scope = initialScopeForProject(tree, 'program');
    expect(resolveScopeProjectIds(scope)?.sort()).toEqual(['program', 'ws-a', 'ws-b'].sort());
  });

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

  it('splits top-level projects by portfolio', () => {
    const mixed: MobileProjectWithStats[] = [
      project({ id: 'w1', portfolio: 'work' }),
      project({ id: 'p1', portfolio: 'personal', client_name: 'Home' }),
    ];
    const result = splitProjectsByPortfolio(mixed);
    expect(result.work.map((item) => item.id)).toEqual(['w1']);
    expect(result.personal.map((item) => item.id)).toEqual(['p1']);
  });

  it('defaults missing portfolio to work when splitting', () => {
    const mixed: MobileProjectWithStats[] = [
      project({ id: 'w1', portfolio: undefined as never }),
      project({ id: 'p1', portfolio: 'personal', client_name: 'Home' }),
    ];
    const result = splitProjectsByPortfolio(mixed);
    expect(result.work.map((item) => item.id)).toEqual(['w1']);
    expect(result.personal.map((item) => item.id)).toEqual(['p1']);
  });

  it('normalizes nested portfolio values from parent', () => {
    const tree: MobileProjectWithStats[] = [
      project({
        id: 'personal-root',
        portfolio: 'personal',
        client_name: 'Home',
        sub_projects: [project({ id: 'child', portfolio: undefined as never, project_name: 'Kitchen' })],
      }),
    ];
    const normalized = normalizeProjectPortfolios(tree);
    expect(normalized[0]?.sub_projects?.[0]?.portfolio).toBe('personal');
  });

  it('toggles portfolio check state', () => {
    const mixed: MobileProjectWithStats[] = [
      project({ id: 'w1', portfolio: 'work' }),
      project({ id: 'p1', portfolio: 'personal', client_name: 'Home' }),
    ];
    expect(getPortfolioCheckState(mixed, 'personal', new Set())).toBe('unchecked');

    const checked = togglePortfolioChecked(mixed, 'personal', new Set());
    expect(getPortfolioCheckState(mixed, 'personal', checked)).toBe('checked');
    expect(checked.has('p1')).toBe(true);
    expect(checked.has('w1')).toBe(false);

    const cleared = togglePortfolioChecked(mixed, 'personal', checked);
    expect(getPortfolioCheckState(mixed, 'personal', cleared)).toBe('unchecked');
  });

  it('selects and deselects an individual personal project in Sunny scope', () => {
    const checked = toggleNodeChecked(mixedPortfolios[2]!, new Set());
    expect(checked.has('personal-1')).toBe(true);
    expect(checked.has('personal-2')).toBe(false);

    const scope = buildChatScope(mixedPortfolios, checked);
    expect(resolveScopeProjectIds(scope)).toEqual(['personal-1']);
    if (scope.kind === 'selected') {
      expect(scope.labels).toEqual(['Home · Renovation']);
    }

    const unchecked = toggleNodeChecked(mixedPortfolios[2]!, checked);
    expect(buildChatScope(mixedPortfolios, unchecked)).toEqual(ALL_PROJECTS_SCOPE);
  });

  it('supports mixed work and personal selections', () => {
    const checked = new Set(['solo', 'personal-2']);
    const scope = buildChatScope(mixedPortfolios, checked);
    expect(resolveScopeProjectIds(scope)?.sort()).toEqual(['solo', 'personal-2'].sort());
    if (scope.kind === 'selected') {
      expect(scope.labels).toContain('Beta · Strategy');
      expect(scope.labels).toContain('Home · Garden');
    }
  });

  it('round-trips personal scope through checked ids', () => {
    const scope = scopeFromPortfolio(mixedPortfolios, 'personal');
    const checked = checkedIdsFromScope(mixedPortfolios, scope);
    expect(checked.has('personal-1')).toBe(true);
    expect(checked.has('personal-2')).toBe(true);
    expect(checked.has('solo')).toBe(false);

    const rebuilt = buildChatScope(mixedPortfolios, checked);
    expect(resolveScopeProjectIds(rebuilt)?.sort()).toEqual(
      resolveScopeProjectIds(scope)?.sort()
    );
  });

  it('removes an individual personal project label from scope chips', () => {
    const scope = buildChatScope(mixedPortfolios, new Set(['personal-1', 'personal-2']));
    const next = removeScopeLabel(mixedPortfolios, scope, 'Home · Renovation');
    expect(resolveScopeProjectIds(next)).toEqual(['personal-2']);
  });

  it('builds personal portfolio scope labels for Sunny chips', () => {
    const scope = scopeFromPortfolio(mixedPortfolios, 'personal');
    expect(formatScopeSummary(scope)).toBe('Personal projects');
    expect(removeScopeLabel(mixedPortfolios, scope, 'Personal projects')).toEqual(ALL_PROJECTS_SCOPE);
  });
});
