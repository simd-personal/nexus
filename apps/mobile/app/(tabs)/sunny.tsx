import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Screen } from '@/components/ui';
import { fetchProjects, streamProjectChat } from '@/lib/api';
import type { ChatMessage } from '@/lib/types';
import { BRAND, radius, spacing } from '@/theme/colors';

export default function SunnyScreen() {
  const insets = useSafeAreaInsets();
  const projectsQuery = useQuery({ queryKey: ['projects'], queryFn: fetchProjects });
  const projects = projectsQuery.data?.projects ?? [];
  const [projectId, setProjectId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  useEffect(() => {
    if (!projectId && projects.length > 0) {
      setProjectId(projects[0].id);
    }
  }, [projectId, projects]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  async function handleSend() {
    if (!projectId || !input.trim() || streaming) return;

    const userMessage: ChatMessage = {
      id: `local-${Date.now()}`,
      session_id: sessionId ?? 'pending',
      role: 'user',
      content: input.trim(),
      created_at: new Date().toISOString(),
    };

    const assistantId = `assistant-${Date.now()}`;
    setMessages((prev) => [...prev, userMessage, { ...userMessage, id: assistantId, role: 'assistant', content: '' }]);
    setInput('');
    setStreaming(true);
    setStatus('Sunny is thinking…');

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await streamProjectChat(
        { projectId, message: userMessage.content, sessionId },
        {
          onSession: (id) => setSessionId(id),
          onStatus: (message) => setStatus(message),
          onToken: (fullText) => {
            setMessages((prev) =>
              prev.map((message) => (message.id === assistantId ? { ...message, content: fullText } : message))
            );
          },
          onMeta: (meta) => {
            if (Array.isArray(meta.citations)) {
              setMessages((prev) =>
                prev.map((message) =>
                  message.id === assistantId
                    ? { ...message, citations: meta.citations as ChatMessage['citations'] }
                    : message
                )
              );
            }
          },
          onDone: (id) => {
            setSessionId(id);
            setStatus(null);
          },
          onError: (message) => setStatus(message),
        },
        controller.signal
      );
    } catch (error) {
      setStatus((error as Error).message);
    } finally {
      setStreaming(false);
    }
  }

  const selectedProject = projects.find((p) => p.id === projectId);

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScreenHeader
          title="Ask Sunny"
          subtitle="Evidence-backed answers from your project materials."
        />

        <View style={styles.pickerSection}>
          <Text style={styles.pickerLabel}>Project</Text>
          {projects.length === 0 ? (
            <Text style={styles.emptyHint}>Create a project on web to start chatting.</Text>
          ) : (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={projects}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.projectPicker}
              renderItem={({ item }) => {
                const active = item.id === projectId;
                return (
                  <Pressable
                    onPress={() => {
                      setProjectId(item.id);
                      setSessionId(undefined);
                      setMessages([]);
                      setStatus(null);
                    }}
                    style={[styles.projectChip, active && styles.projectChipActive]}
                  >
                    <Text style={styles.projectChipClient} numberOfLines={1}>
                      {item.client_name}
                    </Text>
                    <Text
                      style={[styles.projectChipName, active && styles.projectChipNameActive]}
                      numberOfLines={1}
                    >
                      {item.project_name}
                    </Text>
                  </Pressable>
                );
              }}
            />
          )}
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          style={styles.messageList}
          contentContainerStyle={styles.messages}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="sparkles" size={28} color={BRAND.accent} />
              <Text style={styles.emptyTitle}>
                {selectedProject ? `Ask about ${selectedProject.project_name}` : 'Select a project'}
              </Text>
              <Text style={styles.emptyChat}>
                Sunny can explain risks, follow-ups, and what changed recently.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.assistantBubble]}>
              <Text style={[styles.bubbleText, item.role === 'user' && styles.userBubbleText]}>
                {item.content || '…'}
              </Text>
            </View>
          )}
        />

        {status ? (
          <View style={styles.statusRow}>
            {streaming ? <ActivityIndicator size="small" color={BRAND.accent} /> : null}
            <Text style={styles.status}>{status}</Text>
          </View>
        ) : null}

        <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
          <View style={styles.composerRow}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder={projectId ? 'Message Sunny…' : 'Select a project first'}
              placeholderTextColor={BRAND.textMuted}
              style={styles.input}
              multiline
              editable={Boolean(projectId) && !streaming}
            />
            <Pressable
              onPress={handleSend}
              disabled={!projectId || !input.trim() || streaming}
              style={({ pressed }) => [
                styles.sendBtn,
                (!projectId || !input.trim() || streaming) && styles.sendBtnDisabled,
                pressed && styles.sendBtnPressed,
              ]}
            >
              {streaming ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="arrow-up" size={20} color="#fff" />
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pickerSection: {
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  pickerLabel: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    fontSize: 12,
    fontWeight: '600',
    color: BRAND.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  emptyHint: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 14,
    color: BRAND.textMuted,
  },
  projectPicker: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  projectChip: {
    width: 156,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: BRAND.stone,
  },
  projectChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: BRAND.accent,
  },
  projectChipClient: {
    fontSize: 11,
    color: BRAND.textMuted,
    marginBottom: 2,
  },
  projectChipName: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND.graphite,
  },
  projectChipNameActive: {
    color: BRAND.accent,
  },
  messageList: {
    flex: 1,
  },
  messages: {
    padding: spacing.md,
    gap: spacing.sm,
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
    color: BRAND.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  bubble: {
    maxWidth: '88%',
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: BRAND.accent,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 22,
    color: BRAND.graphite,
  },
  userBubbleText: {
    color: '#fff',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
  },
  status: {
    fontSize: 13,
    color: BRAND.textMuted,
  },
  composer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    backgroundColor: '#fff',
  },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#D1D5DB',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    color: BRAND.graphite,
    backgroundColor: BRAND.stone,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BRAND.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.45,
  },
  sendBtnPressed: {
    opacity: 0.85,
  },
});
