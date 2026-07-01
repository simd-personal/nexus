import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ActionItem, CriticalItem } from '@/lib/types';
import { formatRelativeTime } from '@/lib/format';
import { Button, Card, SeverityBadge } from '@/components/ui';
import { BRAND, radius, spacing } from '@/theme/colors';

const KIND_LABELS: Record<string, string> = {
  commitment: 'Commitment',
  decision: 'Decision',
  risk: 'Risk',
};

export function ActionItemRow({
  item,
  onDone,
  onDismiss,
  busy,
}: {
  item: ActionItem;
  onDone?: () => void;
  onDismiss?: () => void;
  busy?: boolean;
}) {
  const kindLabel = item.item_kind ? KIND_LABELS[item.item_kind] ?? item.item_kind : null;

  return (
    <Card>
      <View style={styles.header}>
        <View style={styles.metaRow}>
          {kindLabel ? (
            <View style={styles.kindBadge}>
              <Text style={styles.kindBadgeText}>{kindLabel}</Text>
            </View>
          ) : null}
          <Text style={styles.timestamp}>{formatRelativeTime(item.created_at)}</Text>
        </View>
        {item.project ? (
          <Text style={styles.project}>
            {item.project.client_name} · {item.project.project_name}
          </Text>
        ) : null}
      </View>
      <Text style={styles.title}>{item.title}</Text>
      {item.owner ? <Text style={styles.owner}>Owner: {item.owner}</Text> : null}
      {(onDone || onDismiss) && item.status === 'open' ? (
        <View style={styles.actions}>
          {onDismiss ? (
            <View style={styles.actionButton}>
              <Button label="Not for me" variant="ghost" size="compact" onPress={onDismiss} disabled={busy} />
            </View>
          ) : null}
          {onDone ? (
            <View style={styles.actionButton}>
              <Button label="Done" size="compact" onPress={onDone} disabled={busy} loading={busy} />
            </View>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

export function CriticalItemRow({
  item,
  onAcknowledge,
  onResolve,
  busy,
}: {
  item: CriticalItem;
  onAcknowledge?: () => void;
  onResolve?: () => void;
  busy?: boolean;
}) {
  const highPriority = item.severity === 'critical' || item.severity === 'high';

  return (
    <Card>
      <View style={styles.header}>
        <SeverityBadge severity={item.severity} />
        {item.project ? (
          <Text style={styles.project}>
            {item.project.client_name} · {item.project.project_name}
          </Text>
        ) : null}
      </View>
      <Text style={[styles.title, highPriority && styles.titleDanger]}>{item.title}</Text>
      <Text style={styles.summary} numberOfLines={4}>
        {item.summary}
      </Text>
      {item.status === 'open' && (onAcknowledge || onResolve) ? (
        <View style={styles.actions}>
          {onAcknowledge ? (
            <View style={styles.actionButton}>
              <Button label="Acknowledge" variant="secondary" onPress={onAcknowledge} disabled={busy} />
            </View>
          ) : null}
          {onResolve ? (
            <View style={styles.actionButton}>
              <Button label="Resolve" onPress={onResolve} disabled={busy} loading={busy} />
            </View>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

export function ProjectRow({
  project,
  onPress,
}: {
  project: {
    id: string;
    client_name: string;
    project_name: string;
    status: string;
    portfolio?: 'work' | 'personal';
    critical_item_count?: number;
  };
  onPress: () => void;
}) {
  const portfolio = project.portfolio ?? 'work';

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.projectRow, pressed && styles.projectRowPressed]}>
      <View style={styles.projectText}>
        <View style={styles.projectTitleRow}>
          <Text style={styles.client}>{project.client_name}</Text>
          <View style={[styles.portfolioBadge, portfolio === 'personal' && styles.portfolioBadgePersonal]}>
            <Text style={[styles.portfolioBadgeText, portfolio === 'personal' && styles.portfolioBadgeTextPersonal]}>
              {portfolio === 'personal' ? 'Personal' : 'Work'}
            </Text>
          </View>
        </View>
        <Text style={styles.projectName}>{project.project_name}</Text>
      </View>
      <View style={styles.projectMeta}>
        {(project.critical_item_count ?? 0) > 0 ? (
          <Text style={styles.criticalCount}>{project.critical_item_count} critical</Text>
        ) : (
          <Text style={styles.status}>{project.status.replace('_', ' ')}</Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.xs,
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
  timestamp: {
    fontSize: 12,
    color: BRAND.textMuted,
  },
  owner: {
    fontSize: 13,
    color: BRAND.textMuted,
  },
  project: {
    fontSize: 13,
    color: BRAND.accent,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: BRAND.graphite,
  },
  titleDanger: {
    color: '#B91C1C',
  },
  summary: {
    fontSize: 14,
    lineHeight: 20,
    color: BRAND.textMuted,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  projectRow: {
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  projectRowPressed: {
    opacity: 0.85,
  },
  projectText: {
    flex: 1,
    gap: 2,
  },
  projectTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  portfolioBadge: {
    borderRadius: radius.full,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  portfolioBadgePersonal: {
    backgroundColor: '#F3F4F6',
  },
  portfolioBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: BRAND.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  portfolioBadgeTextPersonal: {
    color: '#6B7280',
  },
  client: {
    fontSize: 13,
    color: BRAND.textMuted,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '600',
    color: BRAND.graphite,
  },
  projectMeta: {
    alignItems: 'flex-end',
  },
  criticalCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B91C1C',
  },
  status: {
    fontSize: 12,
    color: BRAND.textMuted,
    textTransform: 'capitalize',
  },
});
