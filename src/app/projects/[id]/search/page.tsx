import { Suspense } from 'react';
import { GlobalChatPageClient } from '@/components/search/SearchPageClient';
import { LoadingState } from '@/components/ui/EmptyState';
import { getProject, getProjectsWithStats } from '@/lib/data/queries';
import { requireUser } from '@/lib/supabase/server';

export default async function ProjectSearchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [user, project, projects] = await Promise.all([
    requireUser(),
    getProject(id),
    getProjectsWithStats(),
  ]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Suspense fallback={<LoadingState />}>
        <GlobalChatPageClient
          userId={user.id}
          projects={projects}
          projectId={id}
          projectName={project ? `${project.client_name} · ${project.project_name}` : undefined}
          lockScope
        />
      </Suspense>
    </div>
  );
}
