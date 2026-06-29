import { AppShell } from '@/components/layout/AppShell';
import { SunnyChatLauncher } from '@/components/chat/SunnyChatLauncher';
import { getProjectsWithStats } from '@/lib/data/queries';
import { AI_EMPLOYEE_NAME } from '@/lib/constants';
import { requireUser } from '@/lib/supabase/server';

export default async function SunnyChatPage() {
  const [user, projects] = await Promise.all([requireUser(), getProjectsWithStats()]);

  return (
    <AppShell>
      <div className="flex min-h-0 flex-1 flex-col px-4 py-4">
        <div className="mb-4 shrink-0">
          <h1 className="app-page-title text-xl sm:text-2xl">Chat with {AI_EMPLOYEE_NAME}</h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            Create decks, emails, and briefs live in chat, just like ChatGPT and Claude
          </p>
        </div>
        <SunnyChatLauncher userId={user.id} projects={projects} initialProjectId={projects[0]?.id} />
      </div>
    </AppShell>
  );
}
