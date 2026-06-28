import { AppShell } from '@/components/layout/AppShell';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { CreateProjectForm } from '@/components/projects/CreateProjectForm';
import { getProjectsWithStats } from '@/lib/data/queries';

export default async function ProjectsPage() {
  const projects = await getProjectsWithStats();

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Projects</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your client projects</p>
          </div>
          <CreateProjectForm />
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200 dark:bg-[var(--ud-mist)] dark:border-[var(--ud-cloud)]">
            <p className="text-gray-500 dark:text-gray-400 mb-2">No projects yet</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">Create your first project to start uploading client materials.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
