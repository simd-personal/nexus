import { AskSunnyChat } from '@/components/project/AskSunnyChat';
import { getProject, getLatestChatSession } from '@/lib/data/queries';
import { requireUser } from '@/lib/supabase/server';

export default async function AskSunnyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [user, latestChat, project] = await Promise.all([
    requireUser(),
    getLatestChatSession({ sessionType: 'project', projectId: id }),
    getProject(id),
  ]);

  return (
    <AskSunnyChat
      userId={user.id}
      projectId={id}
      initialMessages={latestChat?.messages ?? []}
      initialSessionId={latestChat?.session.id}
      projectName={project ? `${project.client_name} · ${project.project_name}` : undefined}
    />
  );
}
