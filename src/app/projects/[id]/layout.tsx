import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AppShellLayout } from '@/components/layout/AppShellLayout';
import { ProjectLayoutClient } from '@/components/project/ProjectLayoutClient';
import { ProjectNav } from '@/components/project/ProjectNav';
import { StatusBadge } from '@/components/ui/Badge';
import { getProject, getParentProject } from '@/lib/data/queries';

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) notFound();

  const parentProject = await getParentProject(project);

  return (
    <AppShellLayout>
      <ProjectLayoutClient projectId={id}>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="shrink-0 border-b border-gray-200 bg-white px-4 py-4 dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-mist)] sm:px-8 sm:py-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                {parentProject ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    <Link href={`/projects/${parentProject.id}/overview`} className="hover:underline">
                      {parentProject.client_name} · {parentProject.project_name}
                    </Link>
                    {' · Workstream'}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {project.client_name}
                    {!project.parent_project_id && ' · Program'}
                  </p>
                )}
                <h1 className="app-page-title text-xl sm:text-2xl">{project.project_name}</h1>
              </div>
              <StatusBadge status={project.status} />
            </div>
          </div>
          <div className="shrink-0">
            <ProjectNav projectId={id} />
          </div>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 sm:p-6 lg:p-8">{children}</div>
        </div>
      </ProjectLayoutClient>
    </AppShellLayout>
  );
}
