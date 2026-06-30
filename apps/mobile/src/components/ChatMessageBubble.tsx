import { StyleSheet, Text, View } from 'react-native';
import { CitationsList } from '@/components/CitationsList';
import { SunnyMark } from '@/components/SunnyMark';
import { SunnyTypingIndicator } from '@/components/SunnyTypingIndicator';
import { formatChatText } from '@/lib/chat-format';
import type { Citation } from '@/lib/types';
import { BRAND, radius, spacing } from '@/theme/colors';

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

export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isUser = message.role === 'user';
  const isStreaming = message.streaming === true;
  const body = formatChatText(message.content);
  const hasContent = body.length > 0;

  if (isUser) {
    return (
      <View style={styles.userRow}>
        <View style={styles.userBubble}>
          <Text style={styles.userText}>{body}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.assistantRow}>
      <View style={styles.avatarWrap}>
        <SunnyMark size={28} />
      </View>
      <View style={styles.assistantBody}>
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
        <View style={styles.assistantBubble}>
          {hasContent ? (
            <Text style={styles.assistantText}>{body}</Text>
          ) : isStreaming ? (
            <SunnyTypingIndicator />
          ) : null}
          {isStreaming && hasContent ? <View style={styles.cursor} /> : null}
        </View>
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
  userBubble: {
    maxWidth: '82%',
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
    color: '#6B7280',
  },
  modelBadge: {
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  modelBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
  },
  assistantBubble: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#F3F4F6',
    backgroundColor: BRAND.stone,
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
    color: BRAND.graphite,
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
