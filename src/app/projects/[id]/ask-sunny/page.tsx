import { PageGenerationChat } from '@/components/project/PageGenerationChat';
import { getLatestChatSession, getProject } from '@/lib/data/queries';
import { requireUser } from '@/lib/supabase/server';

export default async function AskSunnyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [user, latestChat, project] = await Promise.all([
    requireUser(),
    getLatestChatSession({ sessionType: 'brief', projectId: id }),
    getProject(id),
  ]);

  return (
    <div data-tour="project-ask-sunny">
    <PageGenerationChat
      userId={user.id}
      projectId={id}
      type="brief"
      projectName={project ? `${project.client_name} · ${project.project_name}` : undefined}
      initialMessages={latestChat?.messages ?? []}
      initialSessionId={latestChat?.session.id}
    />
    </div>
  );
}
