import type { Project, ProjectWithStats } from '@/types/database';

export function isTopLevelProject(project: Pick<Project, 'parent_project_id'>): boolean {
  return !project.parent_project_id;
}

export function nestProjectsWithStats(projects: ProjectWithStats[]): ProjectWithStats[] {
  const byId = new Map(projects.map((project) => [project.id, { ...project, sub_projects: [] as ProjectWithStats[] }]));
  const roots: ProjectWithStats[] = [];

  for (const project of byId.values()) {
    if (project.parent_project_id && byId.has(project.parent_project_id)) {
      byId.get(project.parent_project_id)!.sub_projects!.push(project);
    } else if (!project.parent_project_id) {
      roots.push(project);
    }
  }

  for (const root of roots) {
    root.sub_project_count = root.sub_projects?.length ?? 0;
  }

  return roots.sort((a, b) => {
    const aTime = a.last_activity_at ? Date.parse(a.last_activity_at) : 0;
    const bTime = b.last_activity_at ? Date.parse(b.last_activity_at) : 0;
    return bTime - aTime;
  });
}

export function getProjectFamilyIds(
  project: Pick<Project, 'id' | 'parent_project_id'>,
  subProjects: Pick<Project, 'id'>[]
): string[] {
  if (project.parent_project_id) {
    return [project.id];
  }
  return [project.id, ...subProjects.map((child) => child.id)];
}
