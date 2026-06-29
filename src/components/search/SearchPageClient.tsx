'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { ChatLoadingShell } from '@/components/chat/ChatLoadingShell';
import { loadChatScope, persistChatScope } from '@/lib/chat/cache';
import {
  parseProjectIdsFromSearchParams,
  resolveInitialChatScope,
  scopeFromUrlProjects,
  scopesEqual,
  type ChatScope,
} from '@/lib/chat/scope';
import type { ChatMessage, ProjectWithStats } from '@/types/database';

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
  initialSessionId,
  initialMessages = [],
}: {
  userId: string;
  projects: ProjectWithStats[];
  projectId?: string;
  projectName?: string;
  lockScope?: boolean;
  initialSessionId?: string;
  initialMessages?: ChatMessage[];
}) {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') ?? undefined;
  const urlProjectIds = useMemo(() => parseProjectIdsFromSearchParams(searchParams), [searchParams]);
  const urlScopeKey = useMemo(() => [...urlProjectIds].sort().join(','), [urlProjectIds]);

  const [chatScope, setChatScope] = useState<ChatScope>(() =>
    resolveInitialChatScope({
      lockScope,
      projectId,
      projectName,
      projects,
      urlProjectIds,
      persistedScope: loadChatScope(userId),
    })
  );

  const handleScopeChange = useCallback(
    (scope: ChatScope) => {
      setChatScope(scope);
      persistChatScope(userId, scope);
    },
    [userId]
  );

  useEffect(() => {
    void import('@/components/chat/SunnyChatInterface');
  }, []);

  useEffect(() => {
    if (lockScope || urlProjectIds.length === 0) return;
    const next = scopeFromUrlProjects(projects, urlProjectIds);
    setChatScope((prev) => (scopesEqual(prev, next) ? prev : next));
  }, [lockScope, projects, urlScopeKey, urlProjectIds]);

  return (
    <SunnyChatInterface
      userId={userId}
      mode="search"
      projects={projects}
      chatScope={chatScope}
      onScopeChange={lockScope ? undefined : handleScopeChange}
      lockScope={lockScope}
      projectId={projectId}
      projectName={projectName}
      initialSessionId={initialSessionId}
      initialMessages={initialMessages}
      initialQuery={initialQuery}
      embedded={lockScope}
    />
  );
}
