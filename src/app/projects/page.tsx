import Link from 'next/link';
import { AppShellLayout } from '@/components/layout/AppShellLayout';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { CreateProjectForm } from '@/components/projects/CreateProjectForm';
import { Button } from '@/components/ui/Button';
import { getProjectsWithStats } from '@/lib/data/queries';

export default async function ProjectsPage() {
  const projects = await getProjectsWithStats();
  const programOptions = projects.map((project) => ({
    id: project.id,
    client_name: project.client_name,
    project_name: project.project_name,
  }));

  return (
    <AppShellLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="app-page-title text-2xl">Projects</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Programs and workstreams for your clients</p>
          </div>
          <CreateProjectForm programOptions={programOptions} />
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200 dark:bg-[var(--ud-mist)] dark:border-[var(--ud-cloud)]">
            <p className="text-gray-500 dark:text-gray-400 mb-2">No projects yet</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">Create your first project to start uploading client materials.</p>
            <Link href="/getting-started">
              <Button>Get started with Sunny</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </AppShellLayout>
  );
}
