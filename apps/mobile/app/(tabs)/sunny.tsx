import { Feather } from '@expo/vector-icons';
import {
  formatScopeSummary,
  resolveScopeProjectIds,
  scopeFromPortfolio,
  type ChatScope,
} from '@upperdeck/shared/chat-scope';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ChatMessageBubble, type ChatBubbleMessage } from '@/components/ChatMessageBubble';
import { ChatScopeChips } from '@/components/ChatScopeChips';
import { ChatScopePicker } from '@/components/ChatScopePicker';
import { TabScreenHeader } from '@/components/BrandHeader';
import { SunnyMark } from '@/components/SunnyMark';
import { Screen } from '@/components/ui';
import {
  fetchChatSession,
  fetchProjects,
  fetchSearchChatSessions,
  streamSearchChat,
} from '@/lib/api';
import type { ChatMessage } from '@/lib/types';
import { BRAND, radius, spacing } from '@/theme/colors';

const SUGGESTIONS = [
  'What are the critical issues?',
  'Draft a follow up email about staffing concerns',
  'Summarize what changed recently',
  'Give me latest gaps to call out today to the team',
];

type UiMessage = ChatMessage & {
  streaming?: boolean;
  model?: string;
};

function citationProjectId(scope: ChatScope): string | undefined {
  if (scope.kind !== 'selected' || scope.projectIds.length !== 1) return undefined;
  return scope.projectIds[0];
}

function toBubbleMessage(message: UiMessage, scope: ChatScope): ChatBubbleMessage {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    citations: message.citations,
    streaming: message.streaming,
    model: message.model,
    projectId: citationProjectId(scope),
  };
}

export default function SunnyScreen() {
  const projectsQuery = useQuery({ queryKey: ['projects'], queryFn: fetchProjects });
  const projects = projectsQuery.data?.projects ?? [];
  const [scope, setScope] = useState<ChatScope>({ kind: 'all' });
  const [scopeReady, setScopeReady] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const listRef = useRef<FlatList<UiMessage>>(null);
  const assistantIdRef = useRef<string | null>(null);
  const scopeRef = useRef(scope);
  scopeRef.current = scope;
  const scopeInitialized = useRef(false);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  useEffect(() => {
    if (projects.length === 0 || scopeReady) return;
    setScope(scopeFromPortfolio(projects, 'work'));
    setScopeReady(true);
  }, [projects, scopeReady]);

  const loadSearchHistory = useCallback(async () => {
    setLoadingHistory(true);
    setSessionId(undefined);
    setMessages([]);
    setStatus(null);

    try {
      const { sessions } = await fetchSearchChatSessions();
      if (sessions.length === 0) return;

      const { session, messages: history } = await fetchChatSession(sessions[0].id);
      setSessionId(session.id);
      setMessages(history);
    } catch {
      // keep empty state
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    if (!scopeReady) return;
    if (!scopeInitialized.current) {
      scopeInitialized.current = true;
      void loadSearchHistory();
      return;
    }

    abortRef.current?.abort();
    setStreaming(false);
    setSessionId(undefined);
    setMessages([]);
    setStatus(null);
  }, [scope, scopeReady, loadSearchHistory]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (projects.length === 0 || !text.trim() || streaming) return;

      const activeScope = scopeRef.current;
      const userMessage: UiMessage = {
        id: `local-${Date.now()}`,
        session_id: sessionId ?? 'pending',
        role: 'user',
        content: text.trim(),
        created_at: new Date().toISOString(),
      };

      const assistantId = `assistant-${Date.now()}`;
      assistantIdRef.current = assistantId;

      setMessages((prev) => [
        ...prev,
        userMessage,
        {
          ...userMessage,
          id: assistantId,
          role: 'assistant',
          content: '',
          streaming: true,
        },
      ]);
      setInput('');
      setStreaming(true);
      setStatus('Sunny is thinking…');

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        await streamSearchChat(
          {
            query: userMessage.content,
            projectIds: resolveScopeProjectIds(activeScope),
            scopeLabels: activeScope.kind === 'selected' ? activeScope.labels : [],
            sessionId,
          },
          {
            onSession: (id) => setSessionId(id),
            onStatus: (message) => setStatus(message),
            onToken: (fullText) => {
              setMessages((prev) =>
                prev.map((message) =>
                  message.id === assistantId ? { ...message, content: fullText } : message
                )
              );
            },
            onMeta: (meta) => {
              setMessages((prev) =>
                prev.map((message) => {
                  if (message.id !== assistantId) return message;
                  return {
                    ...message,
                    citations: Array.isArray(meta.citations)
                      ? (meta.citations as ChatMessage['citations'])
                      : message.citations,
                    model: typeof meta.model === 'string' ? meta.model : message.model,
                  };
                })
              );
            },
            onError: (message) => {
              setStatus(message);
              setMessages((prev) =>
                prev.map((item) =>
                  item.id === assistantId
                    ? { ...item, content: message, streaming: false }
                    : item
                )
              );
            },
            onDone: (id) => {
              setSessionId(id);
              setStatus(null);

              setMessages((prev) => {
                const assistant = prev.find((item) => item.id === assistantId);
                if (assistant && !assistant.content.trim()) {
                  void fetchChatSession(id).then(({ messages: saved }) => {
                    setMessages(saved);
                  });
                }
                return prev.map((item) =>
                  item.id === assistantId ? { ...item, streaming: false } : item
                );
              });
            },
          },
          controller.signal
        );
      } catch (error) {
        const message = (error as Error).message;
        setStatus(message);
        setMessages((prev) =>
          prev.map((item) =>
            item.id === assistantIdRef.current
              ? { ...item, content: message, streaming: false }
              : item
          )
        );
      } finally {
        setStreaming(false);
        assistantIdRef.current = null;
      }
    },
    [projects.length, sessionId, streaming]
  );

  const canChat = projects.length > 0;
  const scopeSummary = formatScopeSummary(scope);

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={styles.shell}>
          <TabScreenHeader
            title="Ask Sunny"
            subtitle="Evidence-backed answers from your project materials."
          />

          <View style={styles.scopeBar}>
            <Text style={styles.scopeLabel}>Scope</Text>
            {projects.length === 0 ? (
              <Text style={styles.emptyHint}>Create a project to start chatting.</Text>
            ) : (
              <ChatScopePicker projects={projects} scope={scope} onScopeChange={setScope} />
            )}
          </View>

          {projects.length > 0 ? (
            <ChatScopeChips projects={projects} scope={scope} onScopeChange={setScope} />
          ) : null}

          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            style={styles.messageList}
            contentContainerStyle={styles.messages}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            ListEmptyComponent={
              loadingHistory ? (
                <View style={styles.emptyWrap}>
                  <ActivityIndicator color={BRAND.graphite} />
                  <Text style={styles.emptyChat}>Loading conversation…</Text>
                </View>
              ) : (
                <View style={styles.emptyWrap}>
                  <SunnyMark size={56} />
                  <Text style={styles.emptyTitle}>
                    {canChat ? `Ask about ${scopeSummary.toLowerCase()}` : 'Add a project to begin'}
                  </Text>
                  <Text style={styles.emptyChat}>
                    Search your uploaded materials or ask about risks, follow-ups, and what changed
                    recently.
                  </Text>
                  <View style={styles.suggestions}>
                    {SUGGESTIONS.map((suggestion) => (
                      <Pressable
                        key={suggestion}
                        onPress={() => void sendMessage(suggestion)}
                        disabled={!canChat || streaming}
                        style={({ pressed }) => [
                          styles.suggestionChip,
                          pressed && styles.suggestionChipPressed,
                          (!canChat || streaming) && styles.suggestionChipDisabled,
                        ]}
                      >
                        <Text style={styles.suggestionText}>{suggestion}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )
            }
            renderItem={({ item }) => (
              <ChatMessageBubble message={toBubbleMessage(item, scope)} />
            )}
          />

          {status ? (
            <View style={styles.statusRow}>
              {streaming ? <ActivityIndicator size="small" color="#9CA3AF" /> : null}
              <Text style={styles.status}>{status}</Text>
            </View>
          ) : null}

          <View style={styles.composer}>
            <View style={styles.composerShell}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder={
                  streaming
                    ? 'Queue your next message…'
                    : canChat
                      ? 'Ask about your uploaded project materials…'
                      : 'Create a project first'
                }
                placeholderTextColor="#9CA3AF"
                style={styles.input}
                multiline
                editable={canChat && !streaming}
                onSubmitEditing={() => void sendMessage(input)}
                blurOnSubmit={false}
              />
              <Pressable
                onPress={() => void sendMessage(input)}
                disabled={!canChat || !input.trim() || streaming}
                style={({ pressed }) => [
                  styles.sendBtn,
                  (!canChat || !input.trim() || streaming) && styles.sendBtnDisabled,
                  pressed && styles.sendBtnPressed,
                ]}
                accessibilityLabel="Send message"
              >
                <Feather name="send" size={16} color="#fff" />
              </Pressable>
            </View>
            <Text style={styles.composerHint}>
              {streaming ? 'Sunny is responding…' : 'Conversations saved automatically'}
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  shell: {
    flex: 1,
    position: 'relative',
  },
  scopeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  scopeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  emptyHint: {
    flex: 1,
    fontSize: 13,
    color: BRAND.textMuted,
    textAlign: 'right',
  },
  messageList: {
    flex: 1,
    backgroundColor: '#fff',
  },
  messages: {
    padding: spacing.md,
    flexGrow: 1,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: BRAND.graphite,
    textAlign: 'center',
  },
  emptyChat: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 320,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    maxWidth: 360,
  },
  suggestionChip: {
    borderRadius: radius.lg,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  suggestionChipPressed: {
    backgroundColor: '#E5E7EB',
  },
  suggestionChipDisabled: {
    opacity: 0.5,
  },
  suggestionText: {
    fontSize: 12,
    color: '#4B5563',
    textAlign: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
    backgroundColor: '#FAF9F6',
  },
  status: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  composer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: '#FAF9F6',
  },
  composerShell: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    borderRadius: radius.full,
    backgroundColor: '#fff',
    paddingLeft: spacing.md,
    paddingRight: 6,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  input: {
    flex: 1,
    minHeight: 36,
    maxHeight: 120,
    paddingVertical: 8,
    paddingRight: spacing.sm,
    fontSize: 14,
    lineHeight: 20,
    color: BRAND.graphite,
    backgroundColor: 'transparent',
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BRAND.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#94A3E8',
    opacity: 0.55,
  },
  sendBtnPressed: {
    opacity: 0.85,
  },
  composerHint: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
