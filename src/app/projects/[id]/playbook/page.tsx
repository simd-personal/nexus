import { PageGenerationChat } from '@/components/project/PageGenerationChat';
import { getLatestChatSession, getProject } from '@/lib/data/queries';

export default async function PlaybookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [latestChat, project] = await Promise.all([
    getLatestChatSession({ sessionType: 'playbook', projectId: id }),
    getProject(id),
  ]);

  return (
    <PageGenerationChat
      projectId={id}
      type="playbook"
      projectName={project ? `${project.client_name} — ${project.project_name}` : undefined}
      initialMessages={latestChat?.messages ?? []}
      initialSessionId={latestChat?.session.id}
    />
  );
}
