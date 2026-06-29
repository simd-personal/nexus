'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send, Square, Plus, MessageSquare, Copy, Check, Sparkles, ChevronLeft, ChevronRight, Download, Trash2, Cpu, ArrowDown, RefreshCw, X, ListOrdered,
} from 'lucide-react';
import { SunnyAvatar } from '@/components/brand/SunnyAvatar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CitationsList, searchResultsToCitations } from '@/components/ui/Citations';
import { SOURCE_TYPE_LABELS } from '@/lib/constants';
import { AI_EMPLOYEE_NAME } from '@/lib/constants';
import { useSunnyStream } from '@/hooks/useSunnyStream';
import { MAX_QUEUED_MESSAGES, useMessageQueue } from '@/hooks/useMessageQueue';
import { DeckViewer } from '@/components/chat/DeckViewer';
import { MarkdownMessage } from '@/components/chat/MarkdownMessage';
import { parseDeckForViewer } from '@/lib/ai/deck-format';
import {
  chatCacheKey,
  dedupeSessions,
  getOrInitChatScopeState,
  hydrateChatScopeFromStorage,
  loadPersistedActiveSession,
  patchChatScopeState,
  persistActiveSession,
  schedulePersistMessageCache,
  flushPersistMessageCache,
  normalizeChatMessages,
  purgeLegacyUnscopedChatCaches,
  sessionsCacheFresh,
} from '@/lib/chat/cache';
import { consumeInitialQuery } from '@/lib/chat/initial-query';
import {
  ALL_PROJECTS_SCOPE,
  resolveScopeProjectIds,
  type ChatScope,
} from '@/lib/chat/scope';
import { ChatScopeChips, ChatScopePicker } from '@/components/chat/ChatScopePicker';
import type {
  ChatMessage,
  ChatSession,
  ModelPreference,
  SearchResult,
  SourceType,
  SunnyChatArtifact,
  ProjectWithStats,
} from '@/types/database';
import { chatShellClassName } from '@/lib/chat/shell';
import { cn } from '@/lib/utils';

type ChatMode = 'project' | 'search' | 'brief' | 'playbook';

function isProjectScopedMode(mode: ChatMode): boolean {
  return mode === 'project' || mode === 'brief' || mode === 'playbook';
}

function isPageGenerationMode(mode: ChatMode): boolean {
  return mode === 'brief' || mode === 'playbook';
}

function chatTitle(mode: ChatMode): string {
  if (mode === 'search') return `Chat with ${AI_EMPLOYEE_NAME}`;
  if (mode === 'brief') return 'Sunny Brief';
  if (mode === 'playbook') return 'Operating Playbook';
  return `Chat with ${AI_EMPLOYEE_NAME}`;
}

function chatDescription(mode: ChatMode): string {
  if (mode === 'brief') {
    return 'Generate and refine executive briefs from your project materials. Conversations are saved automatically.';
  }
  if (mode === 'playbook') {
    return 'Build and refine client operating playbooks from your project evidence. Conversations are saved automatically.';
  }
  if (mode === 'search') {
    return 'Ask anything, create decks and emails, or search your materials. Pick programs and workstreams to narrow scope.';
  }
  return 'Ask anything or tell Sunny to create emails, decks, and briefs. Responses stream live and conversations are saved automatically.';
}

function cacheScopeKey(mode: ChatMode, projectId?: string, lockScope?: boolean): string {
  if (mode === 'search' && !lockScope) return 'global';
  return projectId ?? 'all';
}

export interface SunnyChatInterfaceProps {
  userId: string;
  mode: 'project' | 'search' | 'brief' | 'playbook';
  projectId?: string;
  projectName?: string;
  projects?: ProjectWithStats[];
  chatScope?: ChatScope;
  onScopeChange?: (scope: ChatScope) => void;
  lockScope?: boolean;
  /** @deprecated Use lockScope */
  onProjectChange?: (projectId: string) => void;
  /** @deprecated Use lockScope */
  lockProject?: boolean;
  embedded?: boolean;
  initialSessionId?: string;
  initialMessages?: ChatMessage[];
  initialQuery?: string;
}

function ArtifactPanel({ artifact }: { artifact: SunnyChatArtifact }) {
  const [copied, setCopied] = useState(false);
  const ext = artifact.type === 'follow_up_email' ? 'txt' : 'md';
  const slug = artifact.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const labels: Record<SunnyChatArtifact['type'], string> = {
    brief: 'Executive Brief',
    deck: 'Presentation Deck',
    playbook: 'Operating Playbook',
    follow_up_email: 'Follow Up Email',
    summary: 'VP Summary',
    action_items: 'Action Items',
  };

  return (
    <div className="mt-3 rounded-xl border border-gray-200 dark:border-[var(--ud-cloud)] bg-gray-50 dark:bg-[var(--ud-stone)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-[var(--ud-cloud)] bg-white dark:bg-[var(--ud-mist)]">
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{labels[artifact.type]}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(artifact.content);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 dark:text-gray-200"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            type="button"
            onClick={() => {
              const blob = new Blob([artifact.content], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${slug || 'sunny-document'}.${ext}`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 dark:text-gray-200"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </button>
        </div>
      </div>
      <div className="p-4 max-h-96 overflow-y-auto text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
        {artifact.content}
      </div>
    </div>
  );
}

function ArtifactToolbar({ artifact }: { artifact: SunnyChatArtifact }) {
  const [copied, setCopied] = useState(false);
  const ext = artifact.type === 'follow_up_email' ? 'txt' : 'md';
  const slug = artifact.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  function download() {
    const blob = new Blob([artifact.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug || 'sunny-document'}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mt-2 flex items-center gap-2">
      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(artifact.content);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-gray-200 dark:border-[var(--ud-cloud)] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[var(--ud-cloud)] dark:bg-[var(--ud-stone)]"
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? 'Copied' : 'Copy'}
      </button>
      <button
        type="button"
        onClick={download}
        className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-gray-200 dark:border-[var(--ud-cloud)] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[var(--ud-cloud)] dark:bg-[var(--ud-stone)]"
      >
        <Download className="w-3.5 h-3.5" />
        Download .{ext}
      </button>
    </div>
  );
}

function MessageActions({
  text,
  onRegenerate,
}: {
  text: string;
  onRegenerate?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  if (!text.trim()) return null;

  return (
    <div className="mt-1.5 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
      <button
        type="button"
        onClick={() => {
          navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-[var(--ud-cloud)] dark:bg-[var(--ud-cloud)] hover:text-gray-700 dark:hover:text-gray-300 dark:text-gray-300"
      >
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        {copied ? 'Copied' : 'Copy'}
      </button>
      {onRegenerate && (
        <button
          type="button"
          onClick={onRegenerate}
          className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-[var(--ud-cloud)] dark:bg-[var(--ud-cloud)] hover:text-gray-700 dark:hover:text-gray-300 dark:text-gray-300"
        >
          <RefreshCw className="h-3 w-3" />
          Regenerate
        </button>
      )}
    </div>
  );
}

export function SunnyChatInterface({
  userId,
  mode,
  projectId,
  projectName,
  projects,
  chatScope: chatScopeProp,
  onScopeChange,
  lockScope: lockScopeProp,
  lockProject = false,
  embedded = false,
  initialSessionId,
  initialMessages = [],
  initialQuery,
}: SunnyChatInterfaceProps) {
  const lockScope = lockScopeProp ?? lockProject;
  const chatScope = chatScopeProp ?? ALL_PROJECTS_SCOPE;
  const scopeKey = chatCacheKey(userId, mode, cacheScopeKey(mode, projectId, lockScope));

  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    hydrateChatScopeFromStorage(scopeKey);
    return getOrInitChatScopeState(scopeKey).sessions;
  });
  const [sessionId, setSessionId] = useState<string | undefined>(() => {
    hydrateChatScopeFromStorage(scopeKey);
    return initialSessionId ?? getOrInitChatScopeState(scopeKey).activeSessionId;
  });
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    hydrateChatScopeFromStorage(scopeKey);
    const cached = getOrInitChatScopeState(scopeKey);
    return initialMessages.length
      ? normalizeChatMessages(initialMessages)
      : normalizeChatMessages(cached.messages);
  });
  const [input, setInput] = useState('');
  const [statusHint, setStatusHint] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(() => getOrInitChatScopeState(scopeKey).sidebarOpen);
  const [sourceFilter, setSourceFilter] = useState(() => getOrInitChatScopeState(scopeKey).sourceFilter);
  const [modelPreference, setModelPreference] = useState<ModelPreference>(
    () => getOrInitChatScopeState(scopeKey).modelPreference
  );
  const [atBottom, setAtBottom] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const initialQuerySentRef = useRef(false);
  const sendingRef = useRef(false);
  const sessionsLoadedRef = useRef(sessionsCacheFresh(scopeKey));
  const restoredRef = useRef(false);
  // Hidden honeypot input — real users never fill it; bots scraping the DOM often do.
  const honeypotRef = useRef<HTMLInputElement>(null);
  const sessionIdRef = useRef<string | undefined>(sessionId);
  const projectIdRef = useRef<string | undefined>(projectId);
  const chatScopeRef = useRef<ChatScope>(chatScope);
  const scopeKeyRef = useRef(scopeKey);
  const { stream, stop, isStreaming } = useSunnyStream();
  const { queue: messageQueue, enqueue, dequeue, removeAt, clear: clearQueue, isFull: queueFull } = useMessageQueue();
  const sendMessageRef = useRef<(text: string, opts?: { regenerate?: boolean }) => Promise<void>>(async () => {});

  useEffect(() => {
    purgeLegacyUnscopedChatCaches();
  }, []);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    projectIdRef.current = projectId;
  }, [projectId]);

  useEffect(() => {
    chatScopeRef.current = chatScope;
  }, [chatScope]);

  const persistScope = useCallback(() => {
    const key = scopeKeyRef.current;
    const state = getOrInitChatScopeState(key);
    const messageCache = sessionId
      ? { ...state.messageCache, [sessionId]: messages }
      : state.messageCache;
    patchChatScopeState(key, {
      sessions,
      activeSessionId: sessionId,
      messages,
      messageCache,
      sidebarOpen,
      sourceFilter,
      modelPreference,
      sessionsFetchedAt: sessionsLoadedRef.current ? state.sessionsFetchedAt ?? Date.now() : undefined,
    });
    schedulePersistMessageCache(key, messageCache);
    if (sessionId) persistActiveSession(key, sessionId);
  }, [sessions, sessionId, messages, sidebarOpen, sourceFilter, modelPreference]);

  useEffect(() => {
    persistScope();
  }, [persistScope]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const syncSidebarForViewport = () => {
      if (!mediaQuery.matches) {
        setSidebarOpen(false);
      }
    };

    syncSidebarForViewport();
    mediaQuery.addEventListener('change', syncSidebarForViewport);
    return () => mediaQuery.removeEventListener('change', syncSidebarForViewport);
  }, []);

  useEffect(() => {
    if (scopeKeyRef.current === scopeKey) return;
    flushPersistMessageCache(scopeKeyRef.current);
    persistScope();
    scopeKeyRef.current = scopeKey;
    restoredRef.current = false;

    const cached = hydrateChatScopeFromStorage(scopeKey);
    setSessions(cached.sessions);
    setSessionId(cached.activeSessionId);
    setMessages(normalizeChatMessages(cached.messages));
    setSidebarOpen(cached.sidebarOpen);
    setSourceFilter(cached.sourceFilter);
    setModelPreference(cached.modelPreference);
    sessionIdRef.current = cached.activeSessionId;
    sessionsLoadedRef.current = sessionsCacheFresh(scopeKey);
  }, [scopeKey, persistScope]);

  const loadSessions = useCallback(async (force = false) => {
    if (!force && sessionsLoadedRef.current && sessionsCacheFresh(scopeKey)) return;

    async function fetchSessions(type: string, scopedProjectId?: string) {
      const params = new URLSearchParams({ type });
      if (scopedProjectId) params.set('project_id', scopedProjectId);
      const res = await fetch(`/api/chat/sessions?${params}`);
      const data = await res.json();
      return (data.sessions ?? []) as ChatSession[];
    }

    let nextSessions: ChatSession[];
    if (lockScope && projectId && mode === 'search') {
      const [searchSessions, projectSessions] = await Promise.all([
        fetchSessions('search', projectId),
        fetchSessions('project', projectId),
      ]);
      nextSessions = dedupeSessions([...searchSessions, ...projectSessions]);
    } else {
      nextSessions = dedupeSessions(await fetchSessions(mode, projectId));
    }

    setSessions(nextSessions);
    sessionsLoadedRef.current = true;
    patchChatScopeState(scopeKey, {
      sessions: nextSessions,
      sessionsFetchedAt: Date.now(),
    });
  }, [mode, projectId, scopeKey, lockScope]);

  const ensureSessions = useCallback(async () => {
    await loadSessions();
  }, [loadSessions]);

  // Restore saved conversations from Supabase on first load / scope change.
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;

    void (async () => {
      await loadSessions(true);

      if (initialSessionId && initialMessages.length > 0) {
        sessionIdRef.current = initialSessionId;
        setSessionId(initialSessionId);
        setMessages(normalizeChatMessages(initialMessages));
        persistActiveSession(scopeKey, initialSessionId);
        patchChatScopeState(scopeKey, {
          activeSessionId: initialSessionId,
          messages: initialMessages,
          messageCache: {
            ...getOrInitChatScopeState(scopeKey).messageCache,
            [initialSessionId]: initialMessages,
          },
        });
        return;
      }

      if (initialSessionId && initialMessages.length === 0) {
        const res = await fetch(`/api/chat/sessions/${initialSessionId}`);
        if (res.ok) {
          const data = await res.json();
          sessionIdRef.current = initialSessionId;
          setSessionId(initialSessionId);
          setMessages(normalizeChatMessages(data.messages ?? []));
          persistActiveSession(scopeKey, initialSessionId);
          patchChatScopeState(scopeKey, {
            activeSessionId: initialSessionId,
            messages: data.messages ?? [],
            messageCache: {
              ...getOrInitChatScopeState(scopeKey).messageCache,
              [initialSessionId]: data.messages ?? [],
            },
          });
          return;
        }
      }

      const persistedId = loadPersistedActiveSession(scopeKey);
      const latestId = getOrInitChatScopeState(scopeKey).sessions[0]?.id;
      const targetId = persistedId ?? latestId;
      if (!targetId) return;

      const cached = getOrInitChatScopeState(scopeKey).messageCache[targetId];
      if (cached?.length) {
        sessionIdRef.current = targetId;
        setSessionId(targetId);
        setMessages(normalizeChatMessages(cached));
        return;
      }

      const res = await fetch(`/api/chat/sessions/${targetId}`);
      if (!res.ok) return;
      const data = await res.json();
      sessionIdRef.current = targetId;
      setSessionId(targetId);
      setMessages(normalizeChatMessages(data.messages ?? []));
      patchChatScopeState(scopeKey, {
        activeSessionId: targetId,
        messages: data.messages ?? [],
        messageCache: {
          ...getOrInitChatScopeState(scopeKey).messageCache,
          [targetId]: data.messages ?? [],
        },
      });
    })();
  }, [scopeKey, initialSessionId, initialMessages, loadSessions]);

  // Only auto-scroll when the user is already near the bottom (native chat feel).
  useEffect(() => {
    if (atBottom) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, statusHint, isStreaming, atBottom]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setAtBottom(distanceFromBottom < 80);
  }, []);

  const scrollToBottom = useCallback(() => {
    setAtBottom(true);
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const loadSession = async (id: string) => {
    await ensureSessions();

    const cached = getOrInitChatScopeState(scopeKey).messageCache[id];
    if (cached) {
      setSessionId(id);
      sessionIdRef.current = id;
      setMessages(normalizeChatMessages(cached));
      if (!window.matchMedia('(min-width: 1024px)').matches) {
        setSidebarOpen(false);
      }
      return;
    }

    const res = await fetch(`/api/chat/sessions/${id}`);
    if (!res.ok) {
      if (res.status === 404) {
        setSessionId(undefined);
        sessionIdRef.current = undefined;
        setMessages([]);
        await loadSessions();
      }
      return;
    }
    const data = await res.json();
    setSessionId(id);
    sessionIdRef.current = id;
    setMessages(data.messages ?? []);
    patchChatScopeState(scopeKey, {
      messageCache: {
        ...getOrInitChatScopeState(scopeKey).messageCache,
        [id]: data.messages ?? [],
      },
      activeSessionId: id,
      messages: data.messages ?? [],
    });
    if (!window.matchMedia('(min-width: 1024px)').matches) {
      setSidebarOpen(false);
    }
  };

  const startNewChat = () => {
    setSessionId(undefined);
    sessionIdRef.current = undefined;
    setMessages([]);
    persistActiveSession(scopeKey, undefined);
    patchChatScopeState(scopeKey, { activeSessionId: undefined, messages: [] });
  };

  const deleteSession = async (id: string) => {
    const res = await fetch(`/api/chat/sessions/${id}`, { method: 'DELETE' });
    if (!res.ok) return;

    const state = getOrInitChatScopeState(scopeKey);
    const messageCache = { ...state.messageCache };
    delete messageCache[id];

    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== id);
      patchChatScopeState(scopeKey, { sessions: next, messageCache });
      return next;
    });

    if (sessionId === id) {
      setSessionId(undefined);
      sessionIdRef.current = undefined;
      setMessages([]);
      patchChatScopeState(scopeKey, { activeSessionId: undefined, messages: [] });
    }
  };

  const sendMessage = useCallback(async (text: string, opts?: { regenerate?: boolean }) => {
    if (!text.trim() || sendingRef.current) return;
    if (isProjectScopedMode(mode) && !projectId) return;

    const regenerate = opts?.regenerate ?? false;
    sendingRef.current = true;
    setAtBottom(true);
    await ensureSessions();

    try {
    // Own the session id on the client so creation is idempotent — the same
    // conversation always reuses one session and can never spawn duplicates.
    let activeSessionId = sessionIdRef.current;
    if (!activeSessionId) {
      activeSessionId = crypto.randomUUID();
      sessionIdRef.current = activeSessionId;
      setSessionId(activeSessionId);
    }

    const assistantId = `a-${Date.now()}`;
    const assistantPlaceholder: ChatMessage = {
      id: assistantId,
      project_id: projectId ?? '',
      role: 'assistant',
      content: '',
      citations: [],
      metadata: { streaming: true },
      created_at: new Date().toISOString(),
      session_id: activeSessionId,
    };

    if (regenerate) {
      // Replace the trailing assistant message in place — no duplicate user turn.
      setMessages((prev) => {
        const next = [...prev];
        while (next.length && next[next.length - 1].role === 'assistant') next.pop();
        return [...next, assistantPlaceholder];
      });
    } else {
      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        project_id: projectId ?? '',
        role: 'user',
        content: text.trim(),
        citations: [],
        metadata:
          mode === 'search' && chatScopeRef.current.kind === 'selected'
            ? {
                scope: {
                  project_ids: chatScopeRef.current.projectIds,
                  labels: chatScopeRef.current.labels,
                },
              }
            : {},
        created_at: new Date().toISOString(),
        session_id: activeSessionId,
      };
      setMessages((prev) => [...prev, userMsg, assistantPlaceholder]);
      setInput('');
    }
    setStatusHint('Connecting...');

    const endpoint = isPageGenerationMode(mode)
      ? '/api/generate/stream'
      : mode === 'search'
        ? '/api/search/stream'
        : '/api/chat/stream';
    const honeypot = honeypotRef.current?.value ?? '';
    const body = isPageGenerationMode(mode)
      ? {
          project_id: projectId,
          message: text.trim(),
          session_id: activeSessionId,
          type: mode,
          regenerate,
          honeypot,
        }
      : mode === 'search'
        ? {
            query: text.trim(),
            project_ids: resolveScopeProjectIds(chatScopeRef.current),
            scope_labels: chatScopeRef.current.kind === 'selected' ? chatScopeRef.current.labels : [],
            source_type: sourceFilter || undefined,
            session_id: activeSessionId,
            model_preference: modelPreference,
            regenerate,
            honeypot,
          }
        : {
            project_id: projectId,
            message: text.trim(),
            session_id: activeSessionId,
            model_preference: modelPreference,
            regenerate,
            honeypot,
          };

    let meta: Record<string, unknown> = {};
    let artifact: SunnyChatArtifact | undefined;
    let results: SearchResult[] = [];

    await stream({
      endpoint,
      body,
      onSession: (id, title) => {
        setSessionId(id);
        sessionIdRef.current = id;
        persistActiveSession(scopeKey, id);
        if (title) {
          setSessions((prev) => {
            const existing = prev.find((s) => s.id === id);
            if (existing) {
              return prev.map((s) => (s.id === id ? { ...s, title } : s));
            }
            return [
              {
                id,
                owner_id: '',
                title,
                project_id: projectId ?? null,
                session_type: mode,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              ...prev,
            ];
          });
        }
        loadSessions(true);
      },
      onStatus: setStatusHint,
      onToken: (fullText) => {
        setStatusHint('');
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: fullText } : m))
        );
      },
      onResults: (r) => {
        results = r;
      },
      onArtifact: (a) => {
        artifact = a;
      },
      onMeta: (m) => {
        meta = m as Record<string, unknown>;
      },
      onDone: () => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  metadata: {
                    ...meta,
                    artifact,
                    results,
                    streaming: false,
                  },
                  citations: (meta.citations as ChatMessage['citations']) ?? [],
                }
              : m
          )
        );
        setStatusHint('');
        loadSessions(true);
      },
      onError: (msg) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: msg || 'Something went wrong.', metadata: { streaming: false } }
              : m
          )
        );
        setStatusHint('');
        loadSessions(true);
      },
    });
    } finally {
      sendingRef.current = false;
      if (!opts?.regenerate) {
        const next = dequeue();
        if (next) {
          void sendMessageRef.current(next);
        }
      }
    }
  }, [mode, projectId, sourceFilter, modelPreference, stream, ensureSessions, loadSessions, dequeue]);

  sendMessageRef.current = sendMessage;

  const submitMessage = useCallback(
    (text: string, opts?: { regenerate?: boolean }) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      if (isProjectScopedMode(mode) && !projectId) return;

      if (!opts?.regenerate && (isStreaming || sendingRef.current)) {
        if (queueFull) return;
        if (enqueue(trimmed)) setInput('');
        return;
      }

      void sendMessage(trimmed, opts);
    },
    [isStreaming, mode, projectId, queueFull, enqueue, sendMessage]
  );

  const handleStop = useCallback(() => {
    stop();
    clearQueue();
  }, [stop, clearQueue]);

  const regenerateLast = useCallback(() => {
    if (isStreaming || sendingRef.current) return;
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUser?.content) return;
    sendMessage(lastUser.content, { regenerate: true });
  }, [isStreaming, messages, sendMessage]);

  const lastAssistantId = [...messages].reverse().find((m) => m.role === 'assistant')?.id;

  useEffect(() => {
    if (!initialQuery || initialQuerySentRef.current) return;
    const queryKey = `${mode}:${projectId ?? 'all'}:${initialQuery}`;
    if (!consumeInitialQuery(queryKey)) return;
    initialQuerySentRef.current = true;
    submitMessage(initialQuery);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const suggestions =
    mode === 'search'
      ? [
          'Tell me everything in the latest Q3 review',
          'Find staffing concerns across all projects',
          'Who mentioned vendor consolidation?',
          'Summarize critical items this week',
        ]
      : mode === 'brief'
        ? [
            'Generate an executive brief from project materials',
            'Focus on risks and recommended next steps',
            'Make the brief shorter and more executive',
            'Highlight what changed recently',
          ]
        : mode === 'playbook'
          ? [
              'Build an operating playbook from project materials',
              'Include follow up cadence and owner actions',
              'Emphasize client concerns and operational risks',
              'Make it shorter for a VP read',
            ]
          : [
              'Draft a follow up email about staffing concerns',
              'Create a Q3 review deck for the board',
              'What are the critical issues?',
              'Pull out action items and add them',
            ];

  return (
    <div className={chatShellClassName(embedded)}>
      {sidebarOpen && (
        <button
          type="button"
          className="absolute inset-0 z-10 bg-black/40 lg:hidden"
          aria-label="Close chat history"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Session sidebar — overlay on phone, inline on desktop */}
      <aside
        className={cn(
          'z-20 flex shrink-0 flex-col border-r border-gray-200 bg-gray-50 dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-stone)]',
          'absolute inset-y-0 left-0 w-64 max-w-[85vw] shadow-xl transition-transform duration-200 ease-in-out',
          'lg:relative lg:inset-auto lg:max-w-none lg:shadow-none lg:transition-[width]',
          sidebarOpen
            ? 'translate-x-0 lg:w-56'
            : '-translate-x-full pointer-events-none lg:pointer-events-auto lg:translate-x-0 lg:w-0 lg:overflow-hidden'
        )}
      >
        <div className="p-3 border-b border-gray-200 dark:border-[var(--ud-cloud)]">
          <button
            type="button"
            onClick={startNewChat}
            className="flex w-full items-center gap-2 rounded-lg border border-gray-200 dark:border-[var(--ud-cloud)] bg-white dark:bg-[var(--ud-mist)] px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[var(--ud-cloud)] dark:bg-[var(--ud-stone)]"
          >
            <Plus className="w-4 h-4" />
            New chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {sessions.map((s) => (
            <div
              key={s.id}
              className={cn(
                'group flex items-center rounded-lg',
                sessionId === s.id ? 'bg-gray-200 dark:bg-[var(--ud-cloud)]' : 'hover:bg-gray-100 dark:hover:bg-[var(--ud-cloud)] dark:bg-[var(--ud-cloud)]'
              )}
            >
              <button
                type="button"
                onClick={() => loadSession(s.id)}
                className={cn(
                  'flex-1 min-w-0 text-left px-3 py-2 text-xs truncate',
                  sessionId === s.id ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-300'
                )}
              >
                <MessageSquare className="w-3 h-3 inline mr-1.5 opacity-50" />
                {s.title ?? 'Conversation'}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  void deleteSession(s.id);
                }}
                className="shrink-0 p-1.5 mr-1 rounded-md text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 hover:text-red-600 hover:bg-red-50 transition-opacity"
                aria-label="Delete chat"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* Main chat */}
      <div className="flex min-h-0 flex-1 flex-col min-w-0">
        <div className="flex shrink-0 items-center gap-2 border-b border-gray-100 bg-white px-4 py-2 dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-mist)]">
          <button
            type="button"
            onClick={() => {
              setSidebarOpen(!sidebarOpen);
              if (!sidebarOpen) void ensureSessions();
            }}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[var(--ud-cloud)] dark:bg-[var(--ud-cloud)] text-gray-500 dark:text-gray-400"
          >
            {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          <SunnyAvatar size="sm" animate={isStreaming ? 'work' : 'idle'} />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{AI_EMPLOYEE_NAME}</span>
          {mode !== 'search' && projectName && (
            <span className="text-xs text-gray-400 dark:text-gray-500 truncate">· {projectName}</span>
          )}
          <div className="ml-auto flex items-center gap-2">
            {mode === 'search' && projects && projects.length > 0 && (
              <ChatScopePicker
                projects={projects}
                scope={chatScope}
                onScopeChange={onScopeChange ?? (() => {})}
                lockScope={lockScope || !onScopeChange}
              />
            )}
            {!isPageGenerationMode(mode) && (
            <div
              className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-[var(--ud-cloud)] bg-gray-50 dark:bg-[var(--ud-stone)] px-2.5 py-1.5 shadow-sm"
              title="Auto routes Q&A to ChatGPT and document creation to Claude"
            >
              <Cpu className="w-4 h-4 shrink-0 text-gray-500 dark:text-gray-400" aria-hidden />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">Model</span>
              <select
                value={modelPreference}
                onChange={(e) => setModelPreference(e.target.value as ModelPreference)}
                aria-label="Choose AI model"
                className="text-xs font-semibold text-gray-900 dark:text-gray-100 border-0 bg-transparent py-0 pl-1 pr-6 cursor-pointer focus:outline-none focus:ring-0 appearance-none bg-[length:12px] bg-[right_0_center] bg-no-repeat"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                }}
              >
                <option value="auto">Auto</option>
                <option value="gpt">ChatGPT</option>
                <option value="claude">Claude</option>
              </select>
            </div>
            )}
          </div>
        </div>

        {mode === 'search' && projects && projects.length > 0 && (
          <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-gray-100 bg-gray-50/80 px-4 py-2 dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-stone)]/60">
            <span className="text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
              Scope
            </span>
            <ChatScopeChips
              scope={chatScope}
              projects={projects}
              onScopeChange={lockScope ? undefined : onScopeChange}
              lockScope={lockScope || !onScopeChange}
            />
          </div>
        )}

        {/* Messages */}
        <div ref={scrollRef} onScroll={handleScroll} className="relative min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="mx-auto mb-4 flex justify-center">
                  <SunnyAvatar size="xl" animate="wave" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {chatTitle(mode)}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
                  {chatDescription(mode)}
                </p>
                <div className="flex flex-wrap gap-2 justify-center max-w-lg mx-auto">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => submitMessage(s)}
                      className="text-xs px-3 py-2 bg-gray-100 dark:bg-[var(--ud-cloud)] rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[var(--ud-slate)]/30 dark:bg-[var(--ud-cloud)] transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => {
              const artifact = msg.metadata?.artifact as SunnyChatArtifact | undefined;
              const actionsTaken = msg.metadata?.actions_taken as string[] | undefined;
              const results = msg.metadata?.results as SearchResult[] | undefined;
              const streaming = msg.metadata?.streaming === true;
              const model = msg.metadata?.model as string | undefined;
              // Cached messages drop artifact.content from localStorage to save space,
              // so a restored deck/doc can arrive without content — never parse it blindly.
              const artifactContent = typeof artifact?.content === 'string' ? artifact.content : '';
              const hasArtifactContent = artifactContent.trim().length > 0;
              const isDeck = artifact?.type === 'deck' && !streaming && hasArtifactContent;
              const isGeneratedDoc =
                !!artifact &&
                !streaming &&
                hasArtifactContent &&
                ['deck', 'brief', 'playbook', 'follow_up_email'].includes(artifact.type);
              const bubbleText = isDeck
                ? `Here's your ${artifact.title}, ${parseDeckForViewer(artifactContent).slides.length} slides. Flip through them below, present fullscreen, or download.`
                : isGeneratedDoc && artifact
                  ? `Here's your ${artifact.title}. Review it below. Use Copy or Download when you're ready.`
                  : msg.content;

              const messageCitations = msg.citations ?? [];
              const sourceCitations =
                messageCitations.length > 0
                  ? messageCitations
                  : results
                    ? searchResultsToCitations(results)
                    : [];
              const sourceProjectId = projectId ?? results?.[0]?.project_id;

              const messageScope = msg.metadata?.scope as
                | { project_ids?: string[]; labels?: string[] }
                | undefined;

              return (
                <div key={msg.id} className={cn('group flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                  {msg.role === 'assistant' && (
                    <div className="shrink-0 mt-0.5">
                      <SunnyAvatar size="sm" animate={streaming ? 'work' : 'none'} />
                    </div>
                  )}
                  <div className={cn('max-w-[85%]', msg.role === 'user' && 'order-first')}>
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{AI_EMPLOYEE_NAME}</span>
                        {model && (
                          <Badge variant="neutral">{model === 'claude' ? 'Claude' : 'ChatGPT'}</Badge>
                        )}
                      </div>
                    )}
                    {msg.role === 'user' ? (
                      <div className="space-y-1.5">
                        {messageScope?.labels && messageScope.labels.length > 0 && (
                          <div className="flex flex-wrap justify-end gap-1">
                            {messageScope.labels.map((label) => (
                              <span
                                key={label}
                                className="rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-[10px] text-white/80"
                              >
                                {label}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="rounded-2xl rounded-br-md bg-gray-900 px-4 py-3 text-sm leading-relaxed text-white whitespace-pre-wrap">
                          {msg.content}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl rounded-bl-md border border-gray-100 dark:border-[var(--ud-cloud)] bg-gray-50 dark:bg-[var(--ud-stone)] px-4 py-3">
                        {bubbleText ? (
                          <MarkdownMessage content={bubbleText} />
                        ) : streaming ? (
                          <div className="flex items-center gap-1.5 py-0.5">
                            <span className="h-2 w-2 animate-bounce rounded-full bg-amber-400 [animation-delay:-0.3s]" />
                            <span className="h-2 w-2 animate-bounce rounded-full bg-amber-400 [animation-delay:-0.15s]" />
                            <span className="h-2 w-2 animate-bounce rounded-full bg-amber-400" />
                          </div>
                        ) : null}
                        {streaming && bubbleText && (
                          <span className="ml-0.5 inline-block h-4 w-2 animate-pulse rounded-sm bg-amber-500 align-middle" />
                        )}
                      </div>
                    )}
                    {msg.role === 'assistant' && actionsTaken && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {actionsTaken.map((a) => (
                          <span key={a} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Sparkles className="w-3 h-3" />{a}
                          </span>
                        ))}
                      </div>
                    )}
                    {msg.role === 'assistant' && artifact && !streaming && hasArtifactContent && (
                      isDeck
                        ? <DeckViewer artifact={artifact} />
                        : isGeneratedDoc
                          ? <ArtifactPanel artifact={artifact} />
                          : artifact.content === msg.content
                            ? <ArtifactToolbar artifact={artifact} />
                            : <ArtifactPanel artifact={artifact} />
                    )}
                    {msg.role === 'assistant' && sourceCitations.length > 0 && !streaming && (
                      <CitationsList citations={sourceCitations} projectId={sourceProjectId} />
                    )}
                    {msg.role === 'assistant' && !streaming && (msg.content || artifact) && (
                      <MessageActions
                        text={artifact?.content || msg.content}
                        onRegenerate={msg.id === lastAssistantId ? regenerateLast : undefined}
                      />
                    )}
                  </div>
                </div>
              );
            })}

            {statusHint && isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center">{statusHint}</p>
            )}
            <div ref={bottomRef} />
          </div>

          {!atBottom && messages.length > 0 && (
            <button
              type="button"
              onClick={scrollToBottom}
              className="sticky bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full border border-gray-200 dark:border-[var(--ud-cloud)] bg-white dark:bg-[var(--ud-mist)] px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 shadow-md hover:bg-gray-50 dark:hover:bg-[var(--ud-cloud)] dark:bg-[var(--ud-stone)]"
            >
              <ArrowDown className="h-3.5 w-3.5" />
              Latest
            </button>
          )}
        </div>

        {/* Composer — pinned bottom */}
        <div className="shrink-0 border-t border-gray-200 bg-white p-4 dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-mist)]">
          <div className="max-w-3xl mx-auto">
            {mode === 'search' && (
              <div className="flex gap-1.5 mb-3 flex-wrap">
                {['', 'deck', 'email', 'meeting', 'note', 'pdf'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSourceFilter(type)}
                    className={cn(
                      'px-2.5 py-1 text-xs rounded-full border transition-colors',
                      sourceFilter === type
                        ? 'bg-gray-900 text-white border-gray-900 dark:bg-gray-100 dark:text-gray-900 dark:border-gray-100'
                        : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-stone)] dark:text-gray-400 dark:hover:bg-[var(--ud-cloud)]'
                    )}
                  >
                    {type ? SOURCE_TYPE_LABELS[type as SourceType] ?? type : 'All types'}
                  </button>
                ))}
              </div>
            )}
            {messageQueue.length > 0 && (
              <div className="mb-3 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                  <ListOrdered className="w-3.5 h-3.5" />
                  Queued ({messageQueue.length}/{MAX_QUEUED_MESSAGES})
                </div>
                {messageQueue.map((queued, index) => (
                  <div
                    key={`${index}-${queued.slice(0, 24)}`}
                    className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-800 dark:bg-amber-950/30"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200 text-[10px] font-semibold text-amber-900 dark:bg-amber-900/60 dark:text-amber-200">
                      {index + 1}
                    </span>
                    <p className="flex-1 text-xs text-gray-700 dark:text-gray-300 line-clamp-2">{queued}</p>
                    <button
                      type="button"
                      onClick={() => removeAt(index)}
                      className="shrink-0 rounded-md p-1 text-gray-400 dark:text-gray-500 hover:bg-amber-100 hover:text-gray-700 dark:hover:text-gray-300 dark:text-gray-300"
                      aria-label={`Remove queued message ${index + 1}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitMessage(input);
              }}
              className="relative flex items-end gap-2 rounded-2xl border border-gray-200 dark:border-[var(--ud-cloud)] bg-gray-50 dark:bg-[var(--ud-stone)] p-2 shadow-sm focus-within:border-gray-300 dark:focus-within:border-gray-500 focus-within:ring-2 focus-within:ring-gray-200 dark:focus-within:ring-gray-600"
            >
              {/* Honeypot: hidden from humans, hidden from a11y tree. Bots that fill it get cooled down. */}
              <input
                ref={honeypotRef}
                type="text"
                name="company_website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="absolute -left-[9999px] h-0 w-0 opacity-0"
              />
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    submitMessage(input);
                  }
                }}
                placeholder={
                  isStreaming
                    ? queueFull
                      ? 'Queue full. Wait for Sunny to finish...'
                      : 'Queue your next message...'
                    : isPageGenerationMode(mode)
                      ? mode === 'brief'
                        ? 'Generate or refine an executive brief...'
                        : 'Generate or refine an operating playbook...'
                      : mode === 'search'
                        ? 'Ask anything about your projects...'
                        : `Message ${AI_EMPLOYEE_NAME}...`
                }
                rows={1}
                disabled={isProjectScopedMode(mode) && !projectId}
                className="flex-1 resize-none bg-transparent px-2 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 dark:text-gray-500 focus:outline-none max-h-[200px]"
              />
              <div className="flex shrink-0 items-center gap-1">
                {isStreaming && (
                  <Button type="button" variant="secondary" size="sm" onClick={handleStop} className="rounded-xl">
                    <Square className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  type="submit"
                  size="sm"
                  disabled={
                    !input.trim() ||
                    (isProjectScopedMode(mode) && !projectId) ||
                    (isStreaming && queueFull)
                  }
                  className="rounded-xl"
                  title={isStreaming ? 'Add to queue' : 'Send message'}
                >
                  {isStreaming ? <ListOrdered className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </form>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center mt-2">
              Enter to send · Shift+Enter for new line
              {isStreaming ? ` · Queue up to ${MAX_QUEUED_MESSAGES} while Sunny responds` : ' · Conversations saved automatically'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
