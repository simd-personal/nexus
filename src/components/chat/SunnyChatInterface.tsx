'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Sun, Send, Square, Plus, MessageSquare, Copy, Check, Sparkles, ChevronLeft, ChevronRight, Download, Trash2, Cpu, ArrowDown, RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CitationsList } from '@/components/ui/Citations';
import { SOURCE_TYPE_LABELS } from '@/lib/constants';
import { AI_EMPLOYEE_NAME } from '@/lib/constants';
import { useSunnyStream } from '@/hooks/useSunnyStream';
import { DeckViewer } from '@/components/chat/DeckViewer';
import { MarkdownMessage } from '@/components/chat/MarkdownMessage';
import { parseDeckForViewer } from '@/lib/ai/deck-format';
import {
  chatCacheKey,
  dedupeSessions,
  getOrInitChatScopeState,
  patchChatScopeState,
  sessionsCacheFresh,
} from '@/lib/chat/cache';
import { consumeInitialQuery } from '@/lib/chat/initial-query';
import type {
  ChatMessage,
  ChatSession,
  ModelPreference,
  SearchResult,
  SourceType,
  SunnyChatArtifact,
  ProjectWithStats,
} from '@/types/database';
import { cn } from '@/lib/utils';

export interface SunnyChatInterfaceProps {
  mode: 'project' | 'search';
  projectId?: string;
  projectName?: string;
  projects?: ProjectWithStats[];
  onProjectChange?: (projectId: string) => void;
  lockProject?: boolean;
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
    follow_up_email: 'Follow-Up Email',
    summary: 'VP Summary',
    action_items: 'Action Items',
  };

  return (
    <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white">
        <span className="text-xs font-semibold text-gray-700">{labels[artifact.type]}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(artifact.content);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800"
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
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </button>
        </div>
      </div>
      <div className="p-4 max-h-96 overflow-y-auto text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
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
        className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? 'Copied' : 'Copy'}
      </button>
      <button
        type="button"
        onClick={download}
        className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
      >
        <Download className="w-3.5 h-3.5" />
        Download .{ext}
      </button>
    </div>
  );
}

function SearchResultsPanel({ results }: { results: SearchResult[] }) {
  if (!results.length) return null;
  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs font-medium text-gray-500">{results.length} source{results.length !== 1 ? 's' : ''} found</p>
      {results.slice(0, 5).map((r) => (
        <div key={r.id} className="rounded-lg border border-gray-200 bg-white p-3 text-xs">
          <div className="flex gap-2 mb-1">
            {r.source_type && <Badge>{SOURCE_TYPE_LABELS[r.source_type as SourceType] ?? r.source_type}</Badge>}
            <Badge variant="neutral">{r.match_reason}</Badge>
          </div>
          <p className="font-medium text-gray-900">{r.file_name}</p>
          {r.project_name && <p className="text-gray-500">{r.client_name} — {r.project_name}</p>}
          <p className="text-gray-600 mt-1 line-clamp-2">{r.text}</p>
        </div>
      ))}
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
        className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-gray-400 hover:bg-gray-100 hover:text-gray-700"
      >
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        {copied ? 'Copied' : 'Copy'}
      </button>
      {onRegenerate && (
        <button
          type="button"
          onClick={onRegenerate}
          className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-gray-400 hover:bg-gray-100 hover:text-gray-700"
        >
          <RefreshCw className="h-3 w-3" />
          Regenerate
        </button>
      )}
    </div>
  );
}

export function SunnyChatInterface({
  mode,
  projectId,
  projectName,
  projects,
  onProjectChange,
  lockProject = false,
  initialSessionId,
  initialMessages = [],
  initialQuery,
}: SunnyChatInterfaceProps) {
  const scopeKey = chatCacheKey(mode, projectId);
  const cachedScope = getOrInitChatScopeState(scopeKey);

  const [sessions, setSessions] = useState<ChatSession[]>(cachedScope.sessions);
  const [sessionId, setSessionId] = useState<string | undefined>(
    initialSessionId ?? cachedScope.activeSessionId
  );
  const [messages, setMessages] = useState<ChatMessage[]>(
    initialMessages.length ? initialMessages : cachedScope.messages
  );
  const [input, setInput] = useState('');
  const [statusHint, setStatusHint] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(cachedScope.sidebarOpen);
  const [sourceFilter, setSourceFilter] = useState(cachedScope.sourceFilter);
  const [modelPreference, setModelPreference] = useState<ModelPreference>(cachedScope.modelPreference);
  const [atBottom, setAtBottom] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const initialQuerySentRef = useRef(false);
  const sendingRef = useRef(false);
  const sessionsLoadedRef = useRef(sessionsCacheFresh(scopeKey));
  const sessionIdRef = useRef<string | undefined>(initialSessionId ?? cachedScope.activeSessionId);
  const projectIdRef = useRef<string | undefined>(projectId);
  const scopeKeyRef = useRef(scopeKey);
  const { stream, stop, isStreaming } = useSunnyStream();

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    projectIdRef.current = projectId;
  }, [projectId]);

  const persistScope = useCallback(() => {
    const key = scopeKeyRef.current;
    const state = getOrInitChatScopeState(key);
    patchChatScopeState(key, {
      sessions,
      activeSessionId: sessionId,
      messages,
      messageCache: sessionId
        ? { ...state.messageCache, [sessionId]: messages }
        : state.messageCache,
      sidebarOpen,
      sourceFilter,
      modelPreference,
      sessionsFetchedAt: sessionsLoadedRef.current ? state.sessionsFetchedAt ?? Date.now() : undefined,
    });
  }, [sessions, sessionId, messages, sidebarOpen, sourceFilter, modelPreference]);

  useEffect(() => {
    persistScope();
  }, [persistScope]);

  useEffect(() => {
    if (scopeKeyRef.current === scopeKey) return;
    persistScope();
    scopeKeyRef.current = scopeKey;

    const cached = getOrInitChatScopeState(scopeKey);
    setSessions(cached.sessions);
    setSessionId(cached.activeSessionId);
    setMessages(cached.messages);
    setSidebarOpen(cached.sidebarOpen);
    setSourceFilter(cached.sourceFilter);
    setModelPreference(cached.modelPreference);
    sessionIdRef.current = cached.activeSessionId;
    sessionsLoadedRef.current = sessionsCacheFresh(scopeKey);
  }, [scopeKey, persistScope]);

  const loadSessions = useCallback(async (force = false) => {
    if (!force && sessionsLoadedRef.current && sessionsCacheFresh(scopeKey)) return;

    const params = new URLSearchParams({ type: mode });
    if (projectId) params.set('project_id', projectId);
    const res = await fetch(`/api/chat/sessions?${params}`);
    const data = await res.json();
    const nextSessions = dedupeSessions(data.sessions ?? []);
    setSessions(nextSessions);
    sessionsLoadedRef.current = true;
    patchChatScopeState(scopeKey, {
      sessions: nextSessions,
      sessionsFetchedAt: Date.now(),
    });
  }, [mode, projectId, scopeKey]);

  const ensureSessions = useCallback(async () => {
    await loadSessions();
  }, [loadSessions]);

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
      setMessages(cached);
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
  };

  const startNewChat = () => {
    setSessionId(undefined);
    sessionIdRef.current = undefined;
    setMessages([]);
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
    if (!text.trim() || isStreaming || sendingRef.current) return;
    if (mode === 'project' && !projectId) return;

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
        metadata: {},
        created_at: new Date().toISOString(),
        session_id: activeSessionId,
      };
      setMessages((prev) => [...prev, userMsg, assistantPlaceholder]);
      setInput('');
    }
    setStatusHint('Connecting...');

    const endpoint = mode === 'search' ? '/api/search/stream' : '/api/chat/stream';
    const body =
      mode === 'search'
        ? {
            query: text.trim(),
            project_id: projectIdRef.current ?? null,
            source_type: sourceFilter || undefined,
            session_id: activeSessionId,
            model_preference: modelPreference,
            regenerate,
          }
        : {
            project_id: projectId,
            message: text.trim(),
            session_id: activeSessionId,
            model_preference: modelPreference,
            regenerate,
          };

    let meta: Record<string, unknown> = {};
    let artifact: SunnyChatArtifact | undefined;
    let results: SearchResult[] = [];

    await stream({
      endpoint,
      body,
      onSession: (id) => {
        setSessionId(id);
        sessionIdRef.current = id;
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
      },
    });
    } finally {
      sendingRef.current = false;
    }
  }, [isStreaming, mode, projectId, sessionId, sourceFilter, modelPreference, stream, ensureSessions, loadSessions, scopeKey]);

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
    sendMessage(initialQuery);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const suggestions =
    mode === 'search'
      ? [
          'Tell me everything in the latest Q3 review',
          'Find staffing concerns across all projects',
          'Who mentioned vendor consolidation?',
          'Summarize critical items this week',
        ]
      : [
          'Draft a follow-up email about staffing concerns',
          'Create a Q3 review deck for the board',
          'What are the critical issues?',
          'Pull out action items and add them',
        ];

  return (
    <div className="flex h-[calc(100vh-4rem)] -mx-4 sm:-mx-0 rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      {/* Session sidebar */}
      <aside
        className={cn(
          'flex flex-col border-r border-gray-200 bg-gray-50 transition-all',
          sidebarOpen ? 'w-56' : 'w-0 overflow-hidden'
        )}
      >
        <div className="p-3 border-b border-gray-200">
          <button
            type="button"
            onClick={startNewChat}
            className="flex w-full items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
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
                sessionId === s.id ? 'bg-gray-200' : 'hover:bg-gray-100'
              )}
            >
              <button
                type="button"
                onClick={() => loadSession(s.id)}
                className={cn(
                  'flex-1 min-w-0 text-left px-3 py-2 text-xs truncate',
                  sessionId === s.id ? 'text-gray-900' : 'text-gray-600'
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
                className="shrink-0 p-1.5 mr-1 rounded-md text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-600 hover:bg-red-50 transition-opacity"
                aria-label="Delete chat"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* Main chat */}
      <div className="flex flex-1 flex-col min-w-0">
        <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100 bg-white">
          <button
            type="button"
            onClick={() => {
              setSidebarOpen(!sidebarOpen);
              if (!sidebarOpen) void ensureSessions();
            }}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          <Sun className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-medium text-gray-900">{AI_EMPLOYEE_NAME}</span>
          {projectName && <span className="text-xs text-gray-400 truncate">· {projectName}</span>}
          <div className="ml-auto flex items-center gap-2">
            <div
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 shadow-sm"
              title="Auto routes Q&A to ChatGPT and document creation to Claude"
            >
              <Cpu className="w-4 h-4 shrink-0 text-gray-500" aria-hidden />
              <span className="text-xs font-medium text-gray-600 whitespace-nowrap">Model</span>
              <select
                value={modelPreference}
                onChange={(e) => setModelPreference(e.target.value as ModelPreference)}
                aria-label="Choose AI model"
                className="text-xs font-semibold text-gray-900 border-0 bg-transparent py-0 pl-1 pr-6 cursor-pointer focus:outline-none focus:ring-0 appearance-none bg-[length:12px] bg-[right_0_center] bg-no-repeat"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                }}
              >
                <option value="auto">Auto</option>
                <option value="gpt">ChatGPT</option>
                <option value="claude">Claude</option>
              </select>
            </div>
            {mode === 'search' && !lockProject && projects && projects.length > 0 && (
              <select
                value={projectId ?? ''}
                onChange={(e) => onProjectChange?.(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white max-w-[220px]"
              >
                <option value="">All projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.client_name} — {p.project_name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} onScroll={handleScroll} className="relative flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
                  <Sun className="w-6 h-6 text-amber-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  {mode === 'search' ? 'Search with Sunny' : `Chat with ${AI_EMPLOYEE_NAME}`}
                </h2>
                <p className="text-sm text-gray-500 mb-8 max-w-md mx-auto">
                  Ask anything or tell Sunny to create emails, decks, and briefs. Responses stream live and conversations are saved automatically.
                </p>
                <div className="flex flex-wrap gap-2 justify-center max-w-lg mx-auto">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => sendMessage(s)}
                      className="text-xs px-3 py-2 bg-gray-100 rounded-xl text-gray-600 hover:bg-gray-200 transition-colors"
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
              const isDeck = artifact?.type === 'deck' && !streaming;
              const isGeneratedDoc =
                artifact &&
                !streaming &&
                ['deck', 'brief', 'playbook', 'follow_up_email'].includes(artifact.type);
              const bubbleText = isDeck
                ? `Here's your ${artifact.title} — ${parseDeckForViewer(artifact.content).slides.length} slides. Flip through them below, present fullscreen, or download.`
                : isGeneratedDoc && artifact
                  ? `Here's your ${artifact.title}. Review it below — use Copy or Download when you're ready.`
                  : msg.content;

              return (
                <div key={msg.id} className={cn('group flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Sun className="w-4 h-4 text-amber-600" />
                    </div>
                  )}
                  <div className={cn('max-w-[85%]', msg.role === 'user' && 'order-first')}>
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-500">{AI_EMPLOYEE_NAME}</span>
                        {model && (
                          <Badge variant="neutral">{model === 'claude' ? 'Claude' : 'ChatGPT'}</Badge>
                        )}
                      </div>
                    )}
                    {msg.role === 'user' ? (
                      <div className="rounded-2xl rounded-br-md bg-gray-900 px-4 py-3 text-sm leading-relaxed text-white whitespace-pre-wrap">
                        {msg.content}
                      </div>
                    ) : (
                      <div className="rounded-2xl rounded-bl-md border border-gray-100 bg-gray-50 px-4 py-3">
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
                    {msg.role === 'assistant' && results && <SearchResultsPanel results={results} />}
                    {msg.role === 'assistant' && artifact && !streaming && (
                      isDeck
                        ? <DeckViewer artifact={artifact} />
                        : isGeneratedDoc
                          ? <ArtifactPanel artifact={artifact} />
                          : artifact.content === msg.content
                            ? <ArtifactToolbar artifact={artifact} />
                            : <ArtifactPanel artifact={artifact} />
                    )}
                    {msg.role === 'assistant' && msg.citations.length > 0 && !streaming && (
                      <CitationsList citations={msg.citations} />
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
              <p className="text-xs text-gray-400 text-center">{statusHint}</p>
            )}
            <div ref={bottomRef} />
          </div>

          {!atBottom && messages.length > 0 && (
            <button
              type="button"
              onClick={scrollToBottom}
              className="sticky bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-md hover:bg-gray-50"
            >
              <ArrowDown className="h-3.5 w-3.5" />
              Latest
            </button>
          )}
        </div>

        {/* Composer — fixed bottom */}
        <div className="border-t border-gray-200 bg-white p-4">
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
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                    )}
                  >
                    {type ? SOURCE_TYPE_LABELS[type as SourceType] ?? type : 'All types'}
                  </button>
                ))}
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="relative flex items-end gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-2 shadow-sm focus-within:border-gray-300 focus-within:ring-2 focus-within:ring-gray-200"
            >
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(input);
                  }
                }}
                placeholder={
                  mode === 'search'
                    ? 'Ask anything about your projects...'
                    : `Message ${AI_EMPLOYEE_NAME}...`
                }
                rows={1}
                disabled={isStreaming || (mode === 'project' && !projectId)}
                className="flex-1 resize-none bg-transparent px-2 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none max-h-[200px]"
              />
              {isStreaming ? (
                <Button type="button" variant="secondary" size="sm" onClick={stop} className="shrink-0 rounded-xl">
                  <Square className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="sm"
                  disabled={!input.trim() || (mode === 'project' && !projectId)}
                  className="shrink-0 rounded-xl"
                >
                  <Send className="w-4 h-4" />
                </Button>
              )}
            </form>
            <p className="text-[10px] text-gray-400 text-center mt-2">
              Enter to send · Shift+Enter for new line · Conversations saved automatically
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
