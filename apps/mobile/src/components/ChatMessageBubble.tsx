import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CitationsList } from '@/components/CitationsList';
import { SunnyMark } from '@/components/SunnyMark';
import { SunnyTypingIndicator } from '@/components/SunnyTypingIndicator';
import { formatChatText } from '@/lib/chat-format';
import type { Citation } from '@/lib/types';
import { APP, BRAND, radius, spacing } from '@/theme/colors';

export type ChatBubbleMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations?: Citation[];
  streaming?: boolean;
  model?: string;
  projectId?: string;
};

type ChatMessageBubbleProps = {
  message: ChatBubbleMessage;
};

function MessageCopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  if (!text.trim()) return null;

  async function handleCopy() {
    await Clipboard.setStringAsync(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Pressable
      onPress={() => void handleCopy()}
      style={styles.copyButton}
      accessibilityRole="button"
      accessibilityLabel={copied ? 'Copied to clipboard' : 'Copy message'}
    >
      <Ionicons
        name={copied ? 'checkmark' : 'copy-outline'}
        size={14}
        color={BRAND.textMuted}
      />
      <Text style={styles.copyLabel}>{copied ? 'Copied' : 'Copy'}</Text>
    </Pressable>
  );
}

export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isUser = message.role === 'user';
  const isStreaming = message.streaming === true;
  const body = formatChatText(message.content);
  const hasContent = body.length > 0;
  const showCopy = hasContent && !isStreaming;

  if (isUser) {
    return (
      <View style={styles.userRow}>
        <View style={styles.userColumn}>
          <View style={styles.userBubble}>
            <Text style={styles.userText}>{body}</Text>
          </View>
          {showCopy ? (
            <View style={styles.userCopyRow}>
              <MessageCopyButton text={body} />
            </View>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.assistantRow} collapsable={false}>
      <View style={styles.avatarWrap}>
        <SunnyMark size={28} />
      </View>
      <View style={styles.assistantBody} collapsable={false}>
        <View style={styles.assistantHeader}>
          <Text style={styles.assistantName}>Sunny</Text>
          {message.model ? (
            <View style={styles.modelBadge}>
              <Text style={styles.modelBadgeText}>
                {message.model === 'claude' ? 'Claude' : 'ChatGPT'}
              </Text>
            </View>
          ) : null}
        </View>
        <View style={styles.assistantBubble} collapsable={false}>
          {hasContent ? (
            <Text style={styles.assistantText} selectable>
              {body}
            </Text>
          ) : isStreaming ? (
            <SunnyTypingIndicator />
          ) : null}
          {isStreaming && hasContent ? <View style={styles.cursor} /> : null}
        </View>
        {showCopy ? <MessageCopyButton text={body} /> : null}
        {message.citations && message.citations.length > 0 && !isStreaming ? (
          <CitationsList citations={message.citations} projectId={message.projectId} />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  userRow: {
    width: '100%',
    alignItems: 'flex-end',
    marginBottom: spacing.sm,
  },
  userColumn: {
    maxWidth: '82%',
    alignItems: 'flex-end',
    gap: 4,
  },
  userBubble: {
    backgroundColor: BRAND.graphite,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userText: {
    fontSize: 15,
    lineHeight: 21,
    color: '#fff',
  },
  userCopyRow: {
    alignSelf: 'flex-end',
  },
  assistantRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.md,
    width: '100%',
  },
  avatarWrap: {
    marginTop: 2,
  },
  assistantBody: {
    flex: 1,
    minWidth: 0,
    alignSelf: 'stretch',
  },
  assistantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 4,
  },
  assistantName: {
    fontSize: 12,
    fontWeight: '600',
    color: APP.textMuted,
  },
  modelBadge: {
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: APP.border,
    backgroundColor: APP.surface,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  modelBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: APP.textMuted,
  },
  assistantBubble: {
    alignSelf: 'stretch',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: APP.border,
    backgroundColor: APP.surfaceMuted,
    borderTopLeftRadius: radius.sm,
    borderTopRightRadius: radius.xl,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  assistantText: {
    fontSize: 15,
    lineHeight: 21,
    color: APP.text,
    flexShrink: 1,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: radius.md,
  },
  copyLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: BRAND.textMuted,
  },
  cursor: {
    marginTop: 4,
    width: 8,
    height: 16,
    borderRadius: 2,
    backgroundColor: '#F59E0B',
    opacity: 0.85,
  },
});
