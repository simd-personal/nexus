'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { ChatLoadingShell } from '@/components/chat/ChatLoadingShell';
import { loadChatScope, persistChatScope } from '@/lib/chat/cache';
import {
  parsePortfolioFromSearchParams,
  parseProjectIdsFromSearchParams,
  resolveInitialChatScope,
  resolvePortfolioChatScope,
  scopeFromUrlProjects,
  scopesEqual,
  type ChatScope,
} from '@/lib/chat/scope';
import type { DashboardPortfolioScope } from '@/lib/projects/portfolio';
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
  defaultPortfolioScope,
  initialSessionId,
  initialMessages = [],
}: {
  userId: string;
  projects: ProjectWithStats[];
  projectId?: string;
  projectName?: string;
  lockScope?: boolean;
  defaultPortfolioScope?: DashboardPortfolioScope;
  initialSessionId?: string;
  initialMessages?: ChatMessage[];
}) {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q')?.trim() || undefined;
  const urlProjectIds = useMemo(() => parseProjectIdsFromSearchParams(searchParams), [searchParams]);
  const urlPortfolio = useMemo(() => parsePortfolioFromSearchParams(searchParams), [searchParams]);
  const activePortfolioScope = urlPortfolio ?? defaultPortfolioScope ?? null;
  const urlScopeKey = useMemo(
    () => `${[...urlProjectIds].sort().join(',')}:${activePortfolioScope ?? ''}`,
    [urlProjectIds, activePortfolioScope]
  );
  const isPrefilledQuery = Boolean(initialQuery && !lockScope);

  const [chatScope, setChatScope] = useState<ChatScope>(() =>
    resolveInitialChatScope({
      lockScope,
      projectId,
      projectName,
      projects,
      urlProjectIds,
      urlPortfolio,
      defaultPortfolioScope,
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

    const next = resolvePortfolioChatScope(projects, activePortfolioScope);
    if (next) {
      setChatScope((prev) => (scopesEqual(prev, next) ? prev : next));
    }
  }, [activePortfolioScope, lockScope, projects, urlScopeKey, urlProjectIds]);

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
