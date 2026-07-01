import { Feather } from '@expo/vector-icons';
import {
  ALL_PROJECTS_SCOPE,
  formatScopeSummary,
  initialScopeForProject,
  normalizeProjectPortfolios,
  resolveScopeProjectIds,
  type ChatScope,
} from '@upperdeck/shared/chat-scope';
import { SUNNY_AUTHORITY_TAGLINE } from '@upperdeck/shared/copy';
import { useQuery } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { ChatMessageBubble, type ChatBubbleMessage } from '@/components/ChatMessageBubble';
import { ChatScopeChips } from '@/components/ChatScopeChips';
import { ChatScopePicker } from '@/components/ChatScopePicker';
import { TabScreenHeader } from '@/components/BrandHeader';
import { useFloatingTabBarLift } from '@/components/FloatingTabBar';
import { SunnyMark } from '@/components/SunnyMark';
import { SwipeTabView } from '@/components/SwipeTabView';
import { Screen } from '@/components/ui';
import {
  fetchChatSession,
  fetchAllProjects,
  streamSearchChat,
} from '@/lib/api';
import { consumePendingSunnyProjectId } from '@/lib/sunny-navigation';
import { cacheScopeChat } from '@/lib/sunny-chat-cache';
import { fetchScopeChatHistory } from '@/lib/sunny-chat-history';
import type { ChatMessage } from '@/lib/types';
import { APP, radius, spacing } from '@/theme/colors';

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
  const tabBarLift = useFloatingTabBarLift();
  const projectsQuery = useQuery({ queryKey: ['projects', 'all'], queryFn: fetchAllProjects });
  const projects = useMemo(
    () => normalizeProjectPortfolios(projectsQuery.data?.projects ?? []),
    [projectsQuery.data?.projects]
  );
  const [scope, setScope] = useState<ChatScope>({ kind: 'all' });
  const [scopeReady, setScopeReady] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const assistantIdRef = useRef<string | null>(null);
  const stickToBottomRef = useRef(true);
  const scopeRef = useRef(scope);
  scopeRef.current = scope;
  const sessionIdRef = useRef<string | undefined>(sessionId);
  sessionIdRef.current = sessionId;
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const previousScopeRef = useRef<ChatScope | null>(null);
  const scopeInitialized = useRef(false);
  const skipInitialHistoryRef = useRef(false);
  const shouldFocusInputRef = useRef(false);
  const inputRef = useRef<TextInput>(null);
  const [footerHeight, setFooterHeight] = useState(96);
  const [keyboardInset, setKeyboardInset] = useState(0);

  const scrollToBottom = useCallback((animated = true) => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated });
    });
  }, []);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardInset(event.endCoordinates.height);
      if (messages.length > 0) {
        setTimeout(() => scrollToBottom(true), Platform.OS === 'ios' ? 50 : 0);
      }
    });
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardInset(0));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [messages.length, scrollToBottom]);

  useEffect(() => {
    if (!stickToBottomRef.current || messages.length === 0) return;
    scrollToBottom(false);
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (projects.length === 0 || scopeReady) return;

    const pendingId = consumePendingSunnyProjectId();
    if (pendingId) {
      setScope(initialScopeForProject(projects, pendingId));
      skipInitialHistoryRef.current = true;
      shouldFocusInputRef.current = true;
    } else {
      setScope(ALL_PROJECTS_SCOPE);
    }
    setScopeReady(true);
  }, [projects, scopeReady]);

  useFocusEffect(
    useCallback(() => {
      if (projects.length === 0) return;

      const pendingId = consumePendingSunnyProjectId();
      if (!pendingId) return;

      setScope(initialScopeForProject(projects, pendingId));
      shouldFocusInputRef.current = true;
    }, [projects])
  );

  useEffect(() => {
    if (!shouldFocusInputRef.current || !scopeReady) return;

    shouldFocusInputRef.current = false;
    const timer = setTimeout(() => inputRef.current?.focus(), 400);
    return () => clearTimeout(timer);
  }, [scope, scopeReady]);

  const loadScopeChat = useCallback(async (targetScope: ChatScope) => {
    setLoadingHistory(true);
    setStatus(null);
    abortRef.current?.abort();
    setStreaming(false);

    try {
      const restored = await fetchScopeChatHistory(targetScope);
      setSessionId(restored.sessionId);
      setMessages(restored.messages);
      cacheScopeChat(targetScope, restored);
    } catch {
      setSessionId(undefined);
      setMessages([]);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    if (!scopeReady) return;

    if (!scopeInitialized.current) {
      scopeInitialized.current = true;
      previousScopeRef.current = scope;
      if (!skipInitialHistoryRef.current) {
        void loadScopeChat(scope);
      }
      skipInitialHistoryRef.current = false;
      return;
    }

    if (previousScopeRef.current) {
      cacheScopeChat(previousScopeRef.current, {
        sessionId: sessionIdRef.current,
        messages: messagesRef.current,
      });
    }

    previousScopeRef.current = scope;
    void loadScopeChat(scope);
  }, [scope, scopeReady, loadScopeChat]);

  useEffect(() => {
    if (!scopeReady || loadingHistory || streaming) return;
    cacheScopeChat(scope, { sessionId, messages });
  }, [scope, scopeReady, sessionId, messages, loadingHistory, streaming]);

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
      stickToBottomRef.current = true;

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
                const next = prev.map((item) =>
                  item.id === assistantId ? { ...item, streaming: false } : item
                );
                cacheScopeChat(scopeRef.current, { sessionId: id, messages: next });

                if (assistant && !assistant.content.trim()) {
                  void fetchChatSession(id).then(({ messages: saved }) => {
                    setMessages(saved);
                    cacheScopeChat(scopeRef.current, { sessionId: id, messages: saved });
                  });
                }
                return next;
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
  const hasMessages = messages.length > 0;
  const listBottomInset =
    footerHeight + keyboardInset + (keyboardInset > 0 ? 0 : tabBarLift) + spacing.lg;

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
    stickToBottomRef.current = distanceFromBottom < 96;
  }

  return (
    <SwipeTabView current="sunny">
    <Screen>
      <View style={styles.shell}>
        <TabScreenHeader
          compactBrand
          title="Ask Sunny"
          subtitle="Evidence-backed answers from your project materials."
        />

        <View style={styles.scopeSection}>
          <Text style={styles.scopeLabel}>Scope</Text>
          {projects.length === 0 ? (
            <Text style={styles.emptyHint}>Create a project to start chatting.</Text>
          ) : (
            <ChatScopePicker projects={projects} scope={scope} onScopeChange={setScope} />
          )}
        </View>
        {projects.length > 0 && scope.kind !== 'all' ? (
          <View style={styles.scopeChipsRow}>
            <ChatScopeChips projects={projects} scope={scope} onScopeChange={setScope} compact />
          </View>
        ) : null}

        <View style={styles.chatColumn}>
          <ScrollView
            ref={scrollRef}
            style={styles.chatArea}
            contentContainerStyle={[
              hasMessages ? styles.messages : styles.messagesEmpty,
              { paddingBottom: listBottomInset },
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            onScroll={handleScroll}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => {
              if (stickToBottomRef.current) scrollToBottom(false);
            }}
          >
            {loadingHistory ? (
              <View style={styles.emptyWrap}>
                <ActivityIndicator color={APP.text} />
                <Text style={styles.emptyChat}>Loading conversation…</Text>
              </View>
            ) : !hasMessages ? (
              <View style={styles.emptyWrap}>
                <SunnyMark size={56} />
                <Text style={styles.emptyTitle}>
                  {canChat ? `Ask about ${scopeSummary.toLowerCase()}` : 'Add a project to begin'}
                </Text>
                {canChat ? (
                  <Text style={styles.authorityTagline}>{SUNNY_AUTHORITY_TAGLINE}</Text>
                ) : null}
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
            ) : (
              messages.map((item) => (
                <ChatMessageBubble key={item.id} message={toBubbleMessage(item, scope)} />
              ))
            )}
          </ScrollView>

          <View
            style={[styles.footer, { bottom: keyboardInset > 0 ? keyboardInset : tabBarLift }]}
            onLayout={(event) => {
              const nextHeight = Math.ceil(event.nativeEvent.layout.height);
              if (nextHeight > 0 && nextHeight !== footerHeight) {
                setFooterHeight(nextHeight);
              }
            }}
          >
            {status ? (
              <View style={styles.statusRow}>
                {streaming ? <ActivityIndicator size="small" color={APP.textSubtle} /> : null}
                <Text style={styles.status}>{status}</Text>
              </View>
            ) : null}

            <View style={styles.composer}>
              <View style={styles.composerShell}>
                <TextInput
                  ref={inputRef}
                  value={input}
                  onChangeText={setInput}
                  placeholder={
                    streaming
                      ? 'Queue your next message…'
                      : canChat
                        ? 'Ask about your uploaded project materials…'
                        : 'Create a project first'
                  }
                  placeholderTextColor={APP.textSubtle}
                  style={styles.input}
                  multiline
                  editable={canChat && !streaming}
                  onFocus={() => {
                    stickToBottomRef.current = true;
                    setTimeout(() => scrollToBottom(true), 100);
                  }}
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
              {keyboardInset === 0 ? (
                <Text style={styles.composerHint}>
                  {streaming ? 'Sunny is responding…' : 'Conversations saved automatically'}
                </Text>
              ) : null}
            </View>
          </View>
        </View>
      </View>
    </Screen>
    </SwipeTabView>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    minHeight: 0,
    backgroundColor: APP.canvas,
  },
  scopeSection: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    backgroundColor: APP.canvas,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: APP.borderFaint,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  scopeChipsRow: {
    flexShrink: 0,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: APP.canvas,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: APP.borderFaint,
  },
  scopeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: APP.textSubtle,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  emptyHint: {
    flex: 1,
    fontSize: 13,
    color: APP.textMuted,
    textAlign: 'right',
  },
  chatColumn: {
    flex: 1,
    minHeight: 0,
  },
  chatArea: {
    flex: 1,
    minHeight: 0,
    backgroundColor: APP.canvas,
  },
  messages: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  messagesEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: APP.text,
    textAlign: 'center',
  },
  authorityTagline: {
    fontSize: 13,
    fontWeight: '300',
    fontStyle: 'italic',
    letterSpacing: 0.2,
    color: '#5c6470',
    textAlign: 'center',
    maxWidth: 320,
  },
  emptyChat: {
    textAlign: 'center',
    color: APP.textMuted,
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
    borderRadius: radius.md,
    backgroundColor: APP.btnSecondaryBg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: APP.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  suggestionChipPressed: {
    backgroundColor: APP.btnSecondaryBgPressed,
  },
  suggestionChipDisabled: {
    opacity: 0.5,
  },
  suggestionText: {
    fontSize: 12,
    color: APP.text,
    textAlign: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
  },
  status: {
    fontSize: 12,
    color: APP.textSubtle,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: APP.canvas,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: APP.borderFaint,
  },
  composer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  composerShell: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: APP.border,
    borderRadius: radius.full,
    backgroundColor: APP.surface,
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
    color: APP.text,
    backgroundColor: 'transparent',
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: APP.btnPrimaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: APP.borderStrong,
    opacity: 0.7,
  },
  sendBtnPressed: {
    opacity: 0.85,
  },
  composerHint: {
    fontSize: 10,
    color: APP.textSubtle,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
