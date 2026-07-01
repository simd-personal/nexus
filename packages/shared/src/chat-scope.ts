import type { MobileProjectWithStats } from './mobile';

export type ChatScope =
  | { kind: 'all' }
  | { kind: 'selected'; projectIds: string[]; labels: string[] };

export const ALL_PROJECTS_SCOPE: ChatScope = { kind: 'all' };

export type TreeCheckState = 'checked' | 'unchecked' | 'indeterminate';

export function projectLabel(
  project: Pick<MobileProjectWithStats, 'client_name' | 'project_name'>
): string {
  return `${project.client_name} · ${project.project_name}`;
}

function getProjectFamilyIds(
  project: Pick<MobileProjectWithStats, 'id'>,
  subProjects: Pick<MobileProjectWithStats, 'id'>[]
): string[] {
  return [project.id, ...subProjects.map((child) => child.id)];
}

export function findProjectInTree(
  projects: MobileProjectWithStats[],
  projectId: string
): MobileProjectWithStats | null {
  for (const root of projects) {
    if (root.id === projectId) return root;
    for (const child of root.sub_projects ?? []) {
      if (child.id === projectId) return child;
    }
  }
  return null;
}

export function initialScopeForProject(
  projects: MobileProjectWithStats[],
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

export function scopeFromPortfolio(
  projects: MobileProjectWithStats[],
  portfolio: 'work' | 'personal'
): ChatScope {
  const projectIds: string[] = [];

  function visit(node: MobileProjectWithStats) {
    if ((node.portfolio ?? 'work') === portfolio) projectIds.push(node.id);
    for (const child of node.sub_projects ?? []) visit(child);
  }

  for (const root of projects) visit(root);
  if (projectIds.length === 0) return ALL_PROJECTS_SCOPE;

  return {
    kind: 'selected',
    projectIds,
    labels: [`${portfolio === 'work' ? 'Work' : 'Personal'} projects`],
  };
}

export function resolveScopeProjectIds(scope: ChatScope): string[] | null {
  if (scope.kind === 'all') return null;
  return scope.projectIds;
}

export function scopeCacheKeySuffix(scope: ChatScope): string {
  if (scope.kind === 'all') return 'all';
  return [...scope.projectIds].sort().join(',');
}

type StoredChatScope = {
  project_ids?: string[];
};

export function storedScopeMatchesChatScope(
  scope: ChatScope,
  stored?: StoredChatScope | null
): boolean {
  if (scope.kind === 'all') {
    return !stored?.project_ids || stored.project_ids.length === 0;
  }
  if (!stored?.project_ids?.length) return false;
  return scopeCacheKeySuffix(scope) === [...stored.project_ids].sort().join(',');
}

export function primaryProjectIdForScope(scope: ChatScope): string | undefined {
  if (scope.kind !== 'selected' || scope.projectIds.length !== 1) return undefined;
  return scope.projectIds[0];
}

export function sessionMatchesChatScope(
  session: { project_id?: string | null },
  scope: ChatScope
): boolean {
  if (scope.kind === 'all') return !session.project_id;
  if (scope.kind === 'selected' && scope.projectIds.length === 1) {
    return session.project_id === scope.projectIds[0];
  }
  if (scope.kind === 'selected' && scope.projectIds.length > 1) {
    return !session.project_id;
  }
  return true;
}

export function formatScopeSummary(scope: ChatScope): string {
  if (scope.kind === 'all') return 'All projects';
  if (scope.labels.length === 1) return scope.labels[0];
  if (scope.labels.length <= 3) return scope.labels.join(', ');
  return `${scope.labels.slice(0, 2).join(', ')} +${scope.labels.length - 2} more`;
}

export function buildChatScope(
  projects: MobileProjectWithStats[],
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
  node: MobileProjectWithStats,
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

export function getNodeCheckState(
  node: MobileProjectWithStats,
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
  projects: MobileProjectWithStats[],
  scope: ChatScope
): Set<string> {
  if (scope.kind === 'all') return new Set();

  const checked = new Set<string>();
  const scopedIds = new Set(scope.projectIds);
  for (const root of projects) {
    applyScopeToNode(root, scopedIds, checked);
  }
  return checked;
}

function applyScopeToNode(
  node: MobileProjectWithStats,
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
  node: MobileProjectWithStats,
  checkedIds: Set<string>
): Set<string> {
  const next = new Set(checkedIds);
  const state = getNodeCheckState(node, checkedIds);
  const shouldCheck = state !== 'checked';

  const apply = (current: MobileProjectWithStats) => {
    if (shouldCheck) next.add(current.id);
    else next.delete(current.id);
    for (const child of current.sub_projects ?? []) {
      apply(child);
    }
  };

  apply(node);
  return next;
}

function collectPortfolioNodeIds(
  projects: MobileProjectWithStats[],
  portfolio: 'work' | 'personal'
): string[] {
  const ids: string[] = [];

  function visit(node: MobileProjectWithStats) {
    if ((node.portfolio ?? 'work') === portfolio) ids.push(node.id);
    for (const child of node.sub_projects ?? []) visit(child);
  }

  for (const root of projects) visit(root);
  return ids;
}

export function getPortfolioCheckState(
  projects: MobileProjectWithStats[],
  portfolio: 'work' | 'personal',
  checkedIds: Set<string>
): TreeCheckState {
  const ids = collectPortfolioNodeIds(projects, portfolio);
  if (ids.length === 0) return 'unchecked';

  const checkedCount = ids.filter((id) => checkedIds.has(id)).length;
  if (checkedCount === 0) return 'unchecked';
  if (checkedCount === ids.length) return 'checked';
  return 'indeterminate';
}

export function togglePortfolioChecked(
  projects: MobileProjectWithStats[],
  portfolio: 'work' | 'personal',
  checkedIds: Set<string>
): Set<string> {
  const shouldCheck = getPortfolioCheckState(projects, portfolio, checkedIds) !== 'checked';
  const next = new Set(checkedIds);

  function visit(node: MobileProjectWithStats) {
    if ((node.portfolio ?? 'work') === portfolio) {
      if (shouldCheck) next.add(node.id);
      else next.delete(node.id);
    }
    for (const child of node.sub_projects ?? []) visit(child);
  }

  for (const root of projects) visit(root);
  return next;
}

export function normalizeProjectPortfolios(
  projects: MobileProjectWithStats[]
): MobileProjectWithStats[] {
  function normalizeNode(
    node: MobileProjectWithStats,
    inherited: 'work' | 'personal'
  ): MobileProjectWithStats {
    const portfolio = node.portfolio ?? inherited;
    const children = node.sub_projects ?? [];
    if (children.length === 0) {
      return portfolio === node.portfolio ? node : { ...node, portfolio };
    }

    const sub_projects = children.map((child) => normalizeNode(child, portfolio));
    return { ...node, portfolio, sub_projects };
  }

  return projects.map((project) => normalizeNode(project, project.portfolio ?? 'work'));
}

export function splitProjectsByPortfolio(projects: MobileProjectWithStats[]) {
  const work: MobileProjectWithStats[] = [];
  const personal: MobileProjectWithStats[] = [];

  for (const project of projects) {
    if ((project.portfolio ?? 'work') === 'personal') personal.push(project);
    else work.push(project);
  }

  return { work, personal };
}

const PORTFOLIO_SCOPE_LABELS: Record<string, 'work' | 'personal'> = {
  'Work projects': 'work',
  'Personal projects': 'personal',
};

export function removeScopeLabel(
  projects: MobileProjectWithStats[],
  scope: ChatScope,
  label: string
): ChatScope {
  if (scope.kind === 'all') return scope;

  const checked = checkedIdsFromScope(projects, scope);
  const portfolio = PORTFOLIO_SCOPE_LABELS[label];
  if (portfolio) {
    for (const root of projects) {
      removePortfolioFromNode(root, portfolio, checked);
    }
    return buildChatScope(projects, checked);
  }

  for (const root of projects) {
    removeLabelFromNode(root, label, checked);
  }
  return buildChatScope(projects, checked);
}

function removePortfolioFromNode(
  node: MobileProjectWithStats,
  portfolio: 'work' | 'personal',
  checked: Set<string>
): void {
  if ((node.portfolio ?? 'work') === portfolio) checked.delete(node.id);
  for (const child of node.sub_projects ?? []) {
    removePortfolioFromNode(child, portfolio, checked);
  }
}

function removeLabelFromNode(
  node: MobileProjectWithStats,
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
