'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { ChatLoadingShell } from '@/components/chat/ChatLoadingShell';
import { loadChatScope, persistChatScope } from '@/lib/chat/cache';
import {
  ALL_PROJECTS_SCOPE,
  parsePortfolioFromSearchParams,
  parseProjectIdsFromSearchParams,
  resolveInitialChatScope,
  scopeFromPortfolio,
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
  const initialQuery = searchParams.get('q')?.trim() || undefined;
  const urlProjectIds = useMemo(() => parseProjectIdsFromSearchParams(searchParams), [searchParams]);
  const urlPortfolio = useMemo(() => parsePortfolioFromSearchParams(searchParams), [searchParams]);
  const urlScopeKey = useMemo(
    () => `${[...urlProjectIds].sort().join(',')}:${urlPortfolio ?? ''}`,
    [urlProjectIds, urlPortfolio]
  );
  const hasUrlScope =
    urlProjectIds.length > 0 || (urlPortfolio != null && urlPortfolio !== 'all');
  const isPrefilledQuery = Boolean(initialQuery && !lockScope);

  const [chatScope, setChatScope] = useState<ChatScope>(() =>
    resolveInitialChatScope({
      lockScope,
      projectId,
      projectName,
      projects,
      urlProjectIds,
      urlPortfolio,
      persistedScope: isPrefilledQuery ? null : loadChatScope(userId),
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
    if (lockScope) return;

    if (urlProjectIds.length > 0) {
      const next = scopeFromUrlProjects(projects, urlProjectIds);
      setChatScope((prev) => (scopesEqual(prev, next) ? prev : next));
      return;
    }

    if (urlPortfolio && urlPortfolio !== 'all') {
      const next = scopeFromPortfolio(projects, urlPortfolio);
      setChatScope((prev) => (scopesEqual(prev, next) ? prev : next));
    }
  }, [lockScope, projects, urlScopeKey, urlProjectIds, urlPortfolio]);

  useEffect(() => {
    if (!isPrefilledQuery || lockScope || hasUrlScope) return;
    setChatScope((prev) => {
      if (prev.kind === 'all') return prev;
      persistChatScope(userId, ALL_PROJECTS_SCOPE);
      return ALL_PROJECTS_SCOPE;
    });
  }, [hasUrlScope, isPrefilledQuery, lockScope, userId]);

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
