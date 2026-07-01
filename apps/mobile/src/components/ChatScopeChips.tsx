import { Feather } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { removeScopeLabel, type ChatScope } from '@upperdeck/shared/chat-scope';
import type { ProjectWithStats } from '@/lib/types';
import { APP, radius, spacing } from '@/theme/colors';

type ChatScopeChipsProps = {
  scope: ChatScope;
  projects: ProjectWithStats[];
  onScopeChange?: (scope: ChatScope) => void;
  compact?: boolean;
};

export function ChatScopeChips({
  scope,
  projects,
  onScopeChange,
  compact = false,
}: ChatScopeChipsProps) {
  if (scope.kind === 'all') {
    return (
      <View style={[styles.row, compact && styles.rowCompact]}>
        <View style={styles.chipNeutral}>
          <Text style={styles.chipNeutralText}>All projects</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={[styles.row, compact && styles.rowCompact]}
    >
      {scope.labels.map((label, index) => (
        <View key={`${label}-${index}`} style={styles.chip}>
          <Text style={styles.chipText} numberOfLines={1}>
            {label}
          </Text>
          {onScopeChange ? (
            <Pressable
              onPress={() => onScopeChange(removeScopeLabel(projects, scope, label))}
              hitSlop={6}
              accessibilityLabel={`Remove ${label} from scope`}
            >
              <Feather name="x" size={12} color={APP.textMuted} />
            </Pressable>
          ) : null}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  rowCompact: {
    paddingHorizontal: 0,
    paddingBottom: 0,
    paddingTop: 0,
  },
  chipNeutral: {
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: APP.border,
    backgroundColor: APP.surfaceMuted,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipNeutralText: {
    fontSize: 12,
    color: APP.textMuted,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: 220,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: APP.btnSecondaryBorder,
    backgroundColor: APP.btnSecondaryBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipText: {
    flexShrink: 1,
    fontSize: 12,
    color: APP.text,
  },
});
