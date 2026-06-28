import { AppShell } from '@/components/layout/AppShell';
import { SunnyChatLauncher } from '@/components/chat/SunnyChatLauncher';
import { getProjectsWithStats } from '@/lib/data/queries';
import { AI_EMPLOYEE_NAME } from '@/lib/constants';

export default async function SunnyChatPage() {
  const projects = await getProjectsWithStats();

  return (
    <AppShell>
      <div className="flex h-[calc(100dvh-3.5rem)] flex-col px-4 py-4 lg:h-screen">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-gray-900">Chat with {AI_EMPLOYEE_NAME}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Create decks, emails, and briefs live in chat, just like ChatGPT and Claude
          </p>
        </div>
        <SunnyChatLauncher projects={projects} initialProjectId={projects[0]?.id} />
      </div>
    </AppShell>
  );
}
