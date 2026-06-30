import { Feather } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { removeScopeLabel, type ChatScope } from '@upperdeck/shared/chat-scope';
import type { ProjectWithStats } from '@/lib/types';
import { radius, spacing } from '@/theme/colors';

type ChatScopeChipsProps = {
  scope: ChatScope;
  projects: ProjectWithStats[];
  onScopeChange?: (scope: ChatScope) => void;
};

export function ChatScopeChips({ scope, projects, onScopeChange }: ChatScopeChipsProps) {
  if (scope.kind === 'all') {
    return (
      <View style={styles.row}>
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
      contentContainerStyle={styles.row}
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
              <Feather name="x" size={12} color="#6B7280" />
            </Pressable>
          ) : null}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  chipNeutral: {
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipNeutralText: {
    fontSize: 12,
    color: '#4B5563',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: 220,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(124,108,240,0.25)',
    backgroundColor: 'rgba(124,108,240,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipText: {
    flexShrink: 1,
    fontSize: 12,
    color: '#374151',
  },
});
