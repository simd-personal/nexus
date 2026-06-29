'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { ChatLoadingShell } from '@/components/chat/ChatLoadingShell';
import type { ProjectWithStats } from '@/types/database';

function flattenProjects(projects: ProjectWithStats[]): ProjectWithStats[] {
  const flattened: ProjectWithStats[] = [];
  for (const project of projects) {
    flattened.push(project);
    for (const subProject of project.sub_projects ?? []) {
      flattened.push(subProject);
    }
  }
  return flattened;
}

const SunnyChatInterface = dynamic(
  () => import('@/components/chat/SunnyChatInterface').then((m) => m.SunnyChatInterface),
  { loading: () => <ChatLoadingShell />, ssr: false }
);

export function SearchPageClient({
  userId,
  projectId: initialProjectId,
  projectName: initialProjectName,
  projects = [],
  lockProject = false,
}: {
  userId: string;
  projectId?: string;
  projectName?: string;
  projects?: ProjectWithStats[];
  lockProject?: boolean;
}) {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') ?? undefined;
  const projectFromUrl = searchParams.get('project') ?? undefined;
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(
    initialProjectId || projectFromUrl || undefined
  );

  const projectOptions = flattenProjects(projects);
  const selectedProject = projectOptions.find((p) => p.id === selectedProjectId);
  const projectName =
    initialProjectName ??
    (selectedProject
      ? `${selectedProject.client_name} · ${selectedProject.project_name}`
      : undefined);

  return (
    <SunnyChatInterface
      userId={userId}
      mode="search"
      projectId={selectedProjectId}
      projectName={projectName}
      projects={projectOptions}
      lockProject={lockProject}
      embedded={lockProject}
      onProjectChange={(id) => setSelectedProjectId(id || undefined)}
      initialQuery={initialQuery}
    />
  );
}

export function GlobalSearchPageClient({
  userId,
  projects,
}: {
  userId: string;
  projects: ProjectWithStats[];
}) {
  return <SearchPageClient userId={userId} projects={projects} />;
}
