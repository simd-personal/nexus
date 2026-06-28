import { AskSunnyChat } from '@/components/project/AskSunnyChat';
import { getProject, getLatestChatSession } from '@/lib/data/queries';

export default async function AskSunnyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [latestChat, project] = await Promise.all([
    getLatestChatSession({ sessionType: 'project', projectId: id }),
    getProject(id),
  ]);

  return (
    <AskSunnyChat
      projectId={id}
      initialMessages={latestChat?.messages ?? []}
      initialSessionId={latestChat?.session.id}
      projectName={project ? `${project.client_name} — ${project.project_name}` : undefined}
    />
  );
}
