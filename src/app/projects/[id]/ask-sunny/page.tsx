import { AskSunnyChat } from '@/components/project/AskSunnyChat';
import { getProjectChatMessages, getProject } from '@/lib/data/queries';

export default async function AskSunnyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [messages, project] = await Promise.all([
    getProjectChatMessages(id),
    getProject(id),
  ]);

  return (
    <AskSunnyChat
      projectId={id}
      initialMessages={messages}
      projectName={project ? `${project.client_name} — ${project.project_name}` : undefined}
    />
  );
}
