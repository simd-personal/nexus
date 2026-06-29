'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { ChatLoadingShell } from '@/components/chat/ChatLoadingShell';
import {
  ALL_PROJECTS_SCOPE,
  initialScopeForProject,
  parseProjectIdsFromSearchParams,
  scopeFromUrlProjects,
  type ChatScope,
} from '@/lib/chat/scope';
import type { ProjectWithStats } from '@/types/database';

const SunnyChatInterface = dynamic(
  () => import('@/components/chat/SunnyChatInterface').then((m) => m.SunnyChatInterface),
  { loading: () => <ChatLoadingShell />, ssr: false }
);

export function GlobalChatPageClient({
  userId,
  projects,
  projectId,
  projectName,
  lockScope = false,
}: {
  userId: string;
  projects: ProjectWithStats[];
  projectId?: string;
  projectName?: string;
  lockScope?: boolean;
}) {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') ?? undefined;
  const urlProjectIds = useMemo(() => parseProjectIdsFromSearchParams(searchParams), [searchParams]);

  const [chatScope, setChatScope] = useState<ChatScope>(() => {
    if (lockScope && projectId) {
      return initialScopeForProject(projects, projectId, projectName);
    }
    if (urlProjectIds.length > 0) {
      return scopeFromUrlProjects(projects, urlProjectIds);
    }
    return ALL_PROJECTS_SCOPE;
  });

  return (
    <SunnyChatInterface
      userId={userId}
      mode="search"
      projects={projects}
      chatScope={chatScope}
      onScopeChange={lockScope ? undefined : setChatScope}
      lockScope={lockScope}
      projectId={projectId}
      projectName={projectName}
      initialQuery={initialQuery}
      embedded={lockScope}
    />
  );
}

/** @deprecated Use GlobalChatPageClient */
export function SearchPageClient(props: {
  userId: string;
  projectId?: string;
  projectName?: string;
  projects?: ProjectWithStats[];
  lockProject?: boolean;
}) {
  return (
    <GlobalChatPageClient
      userId={props.userId}
      projects={props.projects ?? []}
      projectId={props.projectId}
      projectName={props.projectName}
      lockScope={props.lockProject}
    />
  );
}

/** @deprecated Use GlobalChatPageClient */
export function GlobalSearchPageClient({
  userId,
  projects,
}: {
  userId: string;
  projects: ProjectWithStats[];
}) {
  return <GlobalChatPageClient userId={userId} projects={projects} />;
}
