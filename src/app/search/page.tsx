import { Suspense } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { GlobalSearchPageClient } from '@/components/search/SearchPageClient';
import { LoadingState } from '@/components/ui/EmptyState';
import { getProjectsWithStats } from '@/lib/data/queries';
import { AI_EMPLOYEE_NAME } from '@/lib/constants';

export default async function SearchPage() {
  const projects = await getProjectsWithStats();

  return (
    <AppShell>
      <div className="px-4 py-4 h-[calc(100vh-0px)]">
        <div className="mb-4 px-4">
          <h1 className="text-xl font-bold text-gray-900">Search</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Chat with {AI_EMPLOYEE_NAME} across all your projects. Answers stream live and conversations are saved
          </p>
        </div>
        <Suspense fallback={<LoadingState />}>
          <GlobalSearchPageClient projects={projects} />
        </Suspense>
      </div>
    </AppShell>
  );
}
