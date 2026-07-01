import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Card } from '@/components/ui';
import { formatRelativeTime } from '@/lib/format';
import type { ActionItem } from '@/lib/types';
import { BRAND, radius, spacing } from '@/theme/colors';

const KIND_LABELS: Record<string, string> = {
  commitment: 'Commitment',
  decision: 'Decision',
  risk: 'Risk',
};

export function formatActionItemStatus(status: ActionItem['status']): string {
  if (status === 'in_progress') return 'In progress';
  if (status === 'done') return 'Done';
  if (status === 'cancelled') return 'Not for me';
  return 'Open';
}

export function ActionItemPreviewRow({
  item,
  onPress,
}: {
  item: ActionItem;
  onPress: () => void;
}) {
  const kindLabel = item.item_kind ? KIND_LABELS[item.item_kind] ?? item.item_kind : null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.previewWrap, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`Open action item: ${item.title}`}
    >
      <Card>
        <View style={styles.previewHeader}>
          <View style={styles.previewMain}>
            <View style={styles.metaRow}>
              {kindLabel ? (
                <View style={styles.kindBadge}>
                  <Text style={styles.kindBadgeText}>{kindLabel}</Text>
                </View>
              ) : null}
              {item.status !== 'open' ? (
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>{formatActionItemStatus(item.status)}</Text>
                </View>
              ) : null}
              <Text style={styles.timestamp}>{formatRelativeTime(item.created_at)}</Text>
            </View>
            {item.project ? (
              <Text style={styles.project} numberOfLines={1}>
                {item.project.client_name} · {item.project.project_name}
              </Text>
            ) : null}
            <Text style={styles.title} numberOfLines={2}>
              {item.title}
            </Text>
            {item.owner ? <Text style={styles.owner}>Owner: {item.owner}</Text> : null}
          </View>
          <Ionicons name="chevron-forward" size={18} color={BRAND.textMuted} />
        </View>
      </Card>
    </Pressable>
  );
}

export function ActionItemDetailCard({ item }: { item: ActionItem }) {
  const kindLabel = item.item_kind ? KIND_LABELS[item.item_kind] ?? item.item_kind : null;

  return (
    <Card>
      <View style={styles.detailHeader}>
        <View style={styles.metaRow}>
          {kindLabel ? (
            <View style={styles.kindBadge}>
              <Text style={styles.kindBadgeText}>{kindLabel}</Text>
            </View>
          ) : null}
          {item.status !== 'open' ? (
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>{formatActionItemStatus(item.status)}</Text>
            </View>
          ) : null}
          <Text style={styles.timestamp}>{formatRelativeTime(item.created_at)}</Text>
        </View>
        <Text style={styles.detailTitle}>{item.title}</Text>
      </View>

      {item.project ? (
        <Text style={styles.project}>
          {item.project.client_name} · {item.project.project_name}
        </Text>
      ) : null}

      {item.owner ? <Text style={styles.owner}>Owner: {item.owner}</Text> : null}
      {item.due_date ? <Text style={styles.dueDate}>Due {item.due_date}</Text> : null}

      {item.description ? <Text style={styles.description}>{item.description}</Text> : null}
    </Card>
  );
}

export function ActionItemActions({
  item,
  busy,
  onDone,
  onInProgress,
  onDismiss,
}: {
  item: ActionItem;
  busy?: boolean;
  onDone: () => void;
  onInProgress: () => void;
  onDismiss: () => void;
}) {
  const canAct = item.status === 'open' || item.status === 'in_progress';
  if (!canAct) return null;

  return (
    <View style={styles.actions}>
      <Button label="Mark done" onPress={onDone} disabled={busy} loading={busy} />
      {item.status === 'open' ? (
        <Button label="Working on it" variant="secondary" onPress={onInProgress} disabled={busy} />
      ) : null}
      <Button label="Not for me" variant="ghost" onPress={onDismiss} disabled={busy} />
    </View>
  );
}

const styles = StyleSheet.create({
  previewWrap: {
    marginBottom: spacing.sm,
  },
  pressed: {
    opacity: 0.85,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  previewMain: {
    flex: 1,
    gap: spacing.xs,
  },
  detailHeader: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  kindBadge: {
    borderRadius: radius.full,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  kindBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: BRAND.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statusBadge: {
    borderRadius: radius.full,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  timestamp: {
    fontSize: 12,
    color: BRAND.textMuted,
  },
  project: {
    fontSize: 13,
    color: BRAND.accent,
  },
  owner: {
    fontSize: 13,
    color: BRAND.textMuted,
  },
  dueDate: {
    fontSize: 13,
    color: BRAND.textMuted,
    marginTop: spacing.xs,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: BRAND.graphite,
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: BRAND.graphite,
    lineHeight: 28,
  },
  description: {
    marginTop: spacing.md,
    fontSize: 15,
    lineHeight: 22,
    color: BRAND.graphite,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
