import { Suspense } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { GlobalSearchPageClient } from '@/components/search/SearchPageClient';
import { LoadingState } from '@/components/ui/EmptyState';
import { getProjectsWithStats } from '@/lib/data/queries';
import { AI_EMPLOYEE_NAME } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function SearchPage() {
  const projects = await getProjectsWithStats();

  return (
    <AppShell>
      <div className="flex min-h-0 flex-1 flex-col px-4 py-4">
        <div className="mb-4 shrink-0">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Search</h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            Chat with {AI_EMPLOYEE_NAME} across all your projects. Answers stream live and conversations are saved
          </p>
        </div>
        <div className="flex min-h-0 flex-1 flex-col">
          <Suspense fallback={<LoadingState />}>
            <GlobalSearchPageClient projects={projects} />
          </Suspense>
        </div>
      </div>
    </AppShell>
  );
}
