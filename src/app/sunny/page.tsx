import { AppShell } from '@/components/layout/AppShell';
import { GlobalChatPageClient } from '@/components/search/SearchPageClient';
import { getProjectsWithStats } from '@/lib/data/queries';
import { AI_EMPLOYEE_NAME } from '@/lib/constants';
import { requireUser } from '@/lib/supabase/server';
import { Suspense } from 'react';
import { LoadingState } from '@/components/ui/EmptyState';

export default async function SunnyChatPage() {
  const [user, projects] = await Promise.all([requireUser(), getProjectsWithStats()]);

  return (
    <AppShell>
      <div className="flex min-h-0 flex-1 flex-col px-4 py-4">
        <div className="mb-4 shrink-0">
          <h1 className="app-page-title text-xl sm:text-2xl">Chat with {AI_EMPLOYEE_NAME}</h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            Ask anything, create decks and emails, and search across projects. Select programs and workstreams to
            narrow scope.
          </p>
        </div>
        <div className="flex min-h-0 flex-1 flex-col">
          <Suspense fallback={<LoadingState />}>
            <GlobalChatPageClient userId={user.id} projects={projects} />
          </Suspense>
        </div>
      </div>
    </AppShell>
  );
}
