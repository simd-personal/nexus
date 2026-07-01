import { PageGenerationChat } from '@/components/project/PageGenerationChat';
import { PlaybookCoachMark } from '@/components/playbook/PlaybookCoachMark';
import { getLatestChatSession, getProject } from '@/lib/data/queries';
import { requireUser } from '@/lib/supabase/server';

export default async function PlaybookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [user, latestChat, project] = await Promise.all([
    requireUser(),
    getLatestChatSession({ sessionType: 'playbook', projectId: id }),
    getProject(id),
  ]);

  const projectLabel = project ? `${project.client_name} · ${project.project_name}` : undefined;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="playbook-feature-intro hidden sm:flex">
        <PlaybookCoachMark size="md" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-emerald-950 dark:text-emerald-100">Operating Playbook</p>
          <p className="mt-1 text-sm leading-relaxed text-emerald-900/80 dark:text-emerald-200/80">
            A dedicated workspace for cadence, owners, risks, and client talking points. Built for
            the operating plan, separate from Ask Sunny.
          </p>
        </div>
      </div>
      <PageGenerationChat
        userId={user.id}
        projectId={id}
        type="playbook"
        projectName={projectLabel}
        initialMessages={latestChat?.messages ?? []}
        initialSessionId={latestChat?.session.id}
      />
    </div>
  );
}
