import { notFound } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { ProjectNav } from '@/components/project/ProjectNav';
import { StatusBadge } from '@/components/ui/Badge';
import { getProject } from '@/lib/data/queries';

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

  return (
    <AppShell>
      <div className="border-b border-gray-200 bg-white px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{project.client_name}</p>
            <h1 className="text-xl font-bold text-gray-900">{project.project_name}</h1>
          </div>
          <StatusBadge status={project.status} />
        </div>
      </div>
      <ProjectNav projectId={id} />
      <div className="p-8">{children}</div>
    </AppShell>
  );
}
