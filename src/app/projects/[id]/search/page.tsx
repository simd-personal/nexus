import { Suspense } from 'react';
import { SearchPageClient } from '@/components/search/SearchPageClient';
import { LoadingState } from '@/components/ui/EmptyState';
import { getProject } from '@/lib/data/queries';

export default async function ProjectSearchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Search Project Materials</h2>
      <Suspense fallback={<LoadingState />}>
        <SearchPageClient
          projectId={id}
          projectName={
            project ? `${project.client_name} — ${project.project_name}` : undefined
          }
          lockProject
        />
      </Suspense>
    </div>
  );
}
