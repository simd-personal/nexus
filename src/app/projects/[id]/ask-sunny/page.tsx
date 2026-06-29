import { Suspense } from 'react';
import { GlobalChatPageClient } from '@/components/search/SearchPageClient';
import { LoadingState } from '@/components/ui/EmptyState';
import { getLatestChatSessionForProject, getProject, getProjectsWithStats } from '@/lib/data/queries';
import { requireUser } from '@/lib/supabase/server';

export default async function AskSunnyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [user, latestChat, project, projects] = await Promise.all([
    requireUser(),
    getLatestChatSessionForProject(id),
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
          initialSessionId={latestChat?.session.id}
          initialMessages={latestChat?.messages ?? []}
        />
      </Suspense>
    </div>
  );
}
