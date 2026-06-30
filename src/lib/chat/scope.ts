import { getProjectFamilyIds } from '@/lib/projects/hierarchy';
import {
  parseDashboardPortfolioScope,
  projectPortfolioLabel,
  type DashboardPortfolioScope,
  type ProjectPortfolio,
} from '@/lib/projects/portfolio';
import type { ProjectWithStats } from '@/types/database';

export type ChatScope =
  | { kind: 'all' }
  | { kind: 'selected'; projectIds: string[]; labels: string[] };

export const ALL_PROJECTS_SCOPE: ChatScope = { kind: 'all' };

export function projectLabel(
  project: Pick<ProjectWithStats, 'client_name' | 'project_name'>
): string {
  return `${project.client_name} · ${project.project_name}`;
}

export function findProjectInTree(
  projects: ProjectWithStats[],
  projectId: string
): ProjectWithStats | null {
  for (const root of projects) {
    if (root.id === projectId) return root;
    for (const child of root.sub_projects ?? []) {
      if (child.id === projectId) return child;
    }
  }
  return null;
}

export function initialScopeForProject(
  projects: ProjectWithStats[],
  projectId: string,
  fallbackLabel?: string
): ChatScope {
  const node = findProjectInTree(projects, projectId);
  if (!node) {
    return {
      kind: 'selected',
      projectIds: [projectId],
      labels: [fallbackLabel ?? projectId],
    };
  }

  const children = node.sub_projects ?? [];
  if (children.length > 0) {
    return {
      kind: 'selected',
      projectIds: getProjectFamilyIds(node, children),
      labels: [`${projectLabel(node)} · all workstreams`],
    };
  }

  return {
    kind: 'selected',
    projectIds: [node.id],
    labels: [projectLabel(node)],
  };
}

export function scopesEqual(a: ChatScope, b: ChatScope): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'all') return true;
  if (b.kind !== 'selected') return false;
  const aIds = [...a.projectIds].sort().join(',');
  const bIds = [...b.projectIds].sort().join(',');
  if (aIds !== bIds) return false;
  return a.labels.join('\0') === b.labels.join('\0');
}

export function resolvePortfolioChatScope(
  projects: ProjectWithStats[],
  portfolio: DashboardPortfolioScope | null | undefined
): ChatScope | null {
  if (!portfolio || portfolio === 'all') return portfolio === 'all' ? ALL_PROJECTS_SCOPE : null;
  return scopeFromPortfolio(projects, portfolio);
}

export function resolveInitialChatScope(opts: {
  lockScope: boolean;
  projectId?: string;
  projectName?: string;
  projects: ProjectWithStats[];
  urlProjectIds: string[];
  urlPortfolio?: DashboardPortfolioScope | null;
  defaultPortfolioScope?: DashboardPortfolioScope | null;
  persistedScope?: ChatScope | null;
}): ChatScope {
  if (opts.lockScope && opts.projectId) {
    return initialScopeForProject(opts.projects, opts.projectId, opts.projectName);
  }
  if (opts.urlProjectIds.length > 0) {
    return scopeFromUrlProjects(opts.projects, opts.urlProjectIds);
  }

  const portfolioScope = opts.urlPortfolio ?? opts.defaultPortfolioScope ?? null;
  const portfolioScopeResult = resolvePortfolioChatScope(opts.projects, portfolioScope);
  if (portfolioScopeResult) return portfolioScopeResult;

  if (opts.persistedScope) {
    return opts.persistedScope;
  }
  return ALL_PROJECTS_SCOPE;
}

export function scopeFromPortfolio(
  projects: ProjectWithStats[],
  portfolio: ProjectPortfolio
): ChatScope {
  const projectIds = collectPortfolioProjectIds(projects, portfolio);
  if (projectIds.length === 0) return ALL_PROJECTS_SCOPE;

  return {
    kind: 'selected',
    projectIds,
    labels: [`${projectPortfolioLabel(portfolio)} projects`],
  };
}

function collectPortfolioProjectIds(
  projects: ProjectWithStats[],
  portfolio: ProjectPortfolio
): string[] {
  const ids: string[] = [];

  function visit(node: ProjectWithStats) {
    if ((node.portfolio ?? 'work') === portfolio) ids.push(node.id);
    for (const child of node.sub_projects ?? []) visit(child);
  }

  for (const root of projects) visit(root);
  return ids;
}

export function scopeFromUrlProjects(
  projects: ProjectWithStats[],
  projectIds: string[]
): ChatScope {
  if (projectIds.length === 0) return ALL_PROJECTS_SCOPE;

  const resolvedIds = new Set<string>();
  const labels: string[] = [];

  for (const id of projectIds) {
    const node = findProjectInTree(projects, id);
    if (!node) {
      resolvedIds.add(id);
      labels.push(id);
      continue;
    }
    const children = node.sub_projects ?? [];
    if (children.length > 0) {
      for (const familyId of getProjectFamilyIds(node, children)) {
        resolvedIds.add(familyId);
      }
      labels.push(`${projectLabel(node)} · all workstreams`);
    } else {
      resolvedIds.add(node.id);
      labels.push(projectLabel(node));
    }
  }

  return {
    kind: 'selected',
    projectIds: [...resolvedIds],
    labels: labels.length > 0 ? labels : projectIds,
  };
}

export function resolveScopeProjectIds(scope: ChatScope): string[] | null {
  if (scope.kind === 'all') return null;
  return scope.projectIds;
}

export function parseProjectIdsFromSearchParams(searchParams: URLSearchParams): string[] {
  const repeated = searchParams.getAll('projects').flatMap((value) => value.split(','));
  const legacy = searchParams.get('project');
  const ids = [...repeated, ...(legacy ? [legacy] : [])].map((value) => value.trim()).filter(Boolean);
  return [...new Set(ids)];
}

export function parsePortfolioFromSearchParams(
  searchParams: URLSearchParams
): DashboardPortfolioScope | null {
  return parseDashboardPortfolioScope(searchParams.get('portfolio'));
}

export function scopeCacheKeySuffix(scope: ChatScope): string {
  if (scope.kind === 'all') return 'all';
  return [...scope.projectIds].sort().join(',');
}

export function formatScopeSummary(scope: ChatScope): string {
  if (scope.kind === 'all') return 'All projects';
  if (scope.labels.length === 1) return scope.labels[0];
  if (scope.labels.length <= 3) return scope.labels.join(', ');
  return `${scope.labels.slice(0, 2).join(', ')} +${scope.labels.length - 2} more`;
}

export function buildChatScope(
  projects: ProjectWithStats[],
  checkedIds: Set<string>
): ChatScope {
  if (checkedIds.size === 0) return ALL_PROJECTS_SCOPE;

  const projectIds = new Set<string>();
  const labels: string[] = [];

  for (const root of projects) {
    collectScopeFromNode(root, checkedIds, projectIds, labels);
  }

  return {
    kind: 'selected',
    projectIds: [...projectIds],
    labels,
  };
}

function collectScopeFromNode(
  node: ProjectWithStats,
  checkedIds: Set<string>,
  projectIds: Set<string>,
  labels: string[]
): void {
  const children = node.sub_projects ?? [];
  const label = projectLabel(node);

  if (children.length === 0) {
    if (checkedIds.has(node.id)) {
      projectIds.add(node.id);
      labels.push(label);
    }
    return;
  }

  const programChecked = checkedIds.has(node.id);
  const checkedChildren = children.filter((child) => checkedIds.has(child.id));
  const allChildrenChecked = checkedChildren.length === children.length;

  if (programChecked || allChildrenChecked) {
    for (const id of getProjectFamilyIds(node, children)) {
      projectIds.add(id);
    }
    labels.push(`${label} · all workstreams`);
    return;
  }

  for (const child of checkedChildren) {
    projectIds.add(child.id);
    labels.push(projectLabel(child));
  }
}

export type TreeCheckState = 'checked' | 'unchecked' | 'indeterminate';

export function getNodeCheckState(
  node: ProjectWithStats,
  checkedIds: Set<string>
): TreeCheckState {
  const children = node.sub_projects ?? [];
  if (children.length === 0) {
    return checkedIds.has(node.id) ? 'checked' : 'unchecked';
  }

  if (checkedIds.has(node.id)) return 'checked';

  const childStates = children.map((child) => getNodeCheckState(child, checkedIds));
  const checkedCount = childStates.filter((state) => state === 'checked').length;
  const indeterminateCount = childStates.filter((state) => state === 'indeterminate').length;

  if (checkedCount === children.length) return 'checked';
  if (checkedCount > 0 || indeterminateCount > 0) return 'indeterminate';
  return 'unchecked';
}

export function checkedIdsFromScope(
  projects: ProjectWithStats[],
  scope: ChatScope
): Set<string> {
  if (scope.kind === 'all') return new Set();

  const checked = new Set<string>();
  for (const root of projects) {
    applyScopeToNode(root, new Set(scope.projectIds), checked);
  }
  return checked;
}

function applyScopeToNode(
  node: ProjectWithStats,
  scopedIds: Set<string>,
  checked: Set<string>
): void {
  const children = node.sub_projects ?? [];

  if (children.length === 0) {
    if (scopedIds.has(node.id)) checked.add(node.id);
    return;
  }

  const familyIds = getProjectFamilyIds(node, children);
  const entireFamilySelected = familyIds.every((id) => scopedIds.has(id));

  if (entireFamilySelected) {
    checked.add(node.id);
    for (const child of children) checked.add(child.id);
    return;
  }

  for (const child of children) {
    if (scopedIds.has(child.id)) checked.add(child.id);
  }
}

export function toggleNodeChecked(
  node: ProjectWithStats,
  checkedIds: Set<string>
): Set<string> {
  const next = new Set(checkedIds);
  const state = getNodeCheckState(node, checkedIds);
  const shouldCheck = state !== 'checked';

  const apply = (current: ProjectWithStats) => {
    if (shouldCheck) next.add(current.id);
    else next.delete(current.id);
    for (const child of current.sub_projects ?? []) {
      apply(child);
    }
  };

  apply(node);
  return next;
}

export function removeScopeLabel(
  projects: ProjectWithStats[],
  scope: ChatScope,
  label: string
): ChatScope {
  if (scope.kind === 'all') return scope;

  const checked = checkedIdsFromScope(projects, scope);
  for (const root of projects) {
    removeLabelFromNode(root, label, checked);
  }
  return buildChatScope(projects, checked);
}

function removeLabelFromNode(
  node: ProjectWithStats,
  label: string,
  checked: Set<string>
): void {
  const nodeLabel = projectLabel(node);
  const allWorkstreamsLabel = `${nodeLabel} · all workstreams`;
  const children = node.sub_projects ?? [];

  if (label === allWorkstreamsLabel || (label === nodeLabel && children.length > 0)) {
    checked.delete(node.id);
    for (const child of children) checked.delete(child.id);
    return;
  }

  if (label === nodeLabel) {
    checked.delete(node.id);
    return;
  }

  for (const child of children) {
    if (projectLabel(child) === label) {
      checked.delete(child.id);
      checked.delete(node.id);
    }
  }
}
