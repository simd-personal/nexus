import { StyleSheet, Text, View } from 'react-native';
import { CitationsList } from '@/components/CitationsList';
import { SunnyMark } from '@/components/SunnyMark';
import { SunnyTypingIndicator } from '@/components/SunnyTypingIndicator';
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
  const hasContent = message.content.trim().length > 0;

  if (isUser) {
    return (
      <View style={styles.userRow}>
        <View style={styles.userBubble}>
          <Text style={styles.userText}>{message.content}</Text>
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
            <Text style={styles.assistantText}>{message.content}</Text>
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
    alignItems: 'flex-end',
    marginBottom: spacing.md,
  },
  userBubble: {
    maxWidth: '85%',
    backgroundColor: BRAND.graphite,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  userText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#fff',
  },
  assistantRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  avatarWrap: {
    marginTop: 2,
  },
  assistantBody: {
    flex: 1,
    maxWidth: '88%',
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
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  assistantText: {
    fontSize: 15,
    lineHeight: 22,
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
