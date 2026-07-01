import type { ProjectWithStats } from '@/types/database';

export type DashboardProjectOption = {
  id: string;
  client_name: string;
  project_name: string;
  label: string;
};

export function listDashboardProjectOptions(projects: ProjectWithStats[]): DashboardProjectOption[] {
  const options: DashboardProjectOption[] = [];

  function add(project: ProjectWithStats) {
    options.push({
      id: project.id,
      client_name: project.client_name,
      project_name: project.project_name,
      label: `${project.client_name} · ${project.project_name}`,
    });
  }

  for (const project of projects) {
    add(project);
    for (const sub of project.sub_projects ?? []) {
      add(sub);
    }
  }

  return options;
}

export function resolveExecutiveOnePagerProjectIds(
  projects: ProjectWithStats[],
  selection: 'all' | string
): string[] {
  if (selection !== 'all') return [selection];
  return listDashboardProjectOptions(projects).map((option) => option.id);
}
