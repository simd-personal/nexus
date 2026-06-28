'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { ChatLoadingShell } from '@/components/chat/ChatLoadingShell';
import type { ProjectWithStats } from '@/types/database';

const SunnyChatInterface = dynamic(
  () => import('@/components/chat/SunnyChatInterface').then((m) => m.SunnyChatInterface),
  { loading: () => <ChatLoadingShell />, ssr: false }
);

export function SearchPageClient({
  projectId: initialProjectId,
  projectName: initialProjectName,
  projects = [],
  lockProject = false,
}: {
  projectId?: string;
  projectName?: string;
  projects?: ProjectWithStats[];
  lockProject?: boolean;
}) {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') ?? undefined;
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(
    initialProjectId || undefined
  );

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const projectName =
    initialProjectName ??
    (selectedProject
      ? `${selectedProject.client_name} · ${selectedProject.project_name}`
      : undefined);

  return (
    <SunnyChatInterface
      mode="search"
      projectId={selectedProjectId}
      projectName={projectName}
      projects={projects}
      lockProject={lockProject}
      onProjectChange={(id) => setSelectedProjectId(id || undefined)}
      initialQuery={initialQuery}
    />
  );
}

export function GlobalSearchPageClient({ projects }: { projects: ProjectWithStats[] }) {
  return <SearchPageClient projects={projects} />;
}
