import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { CriticalItem } from '@/lib/types';
import { Button, Card, SeverityBadge } from '@/components/ui';
import { APP, BRAND, radius, spacing } from '@/theme/colors';

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
  project: {
    fontSize: 13,
    color: BRAND.accent,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: APP.text,
  },
  titleDanger: {
    color: '#B91C1C',
  },
  summary: {
    fontSize: 14,
    lineHeight: 20,
    color: APP.textMuted,
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
    backgroundColor: APP.surface,
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: APP.border,
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
    backgroundColor: APP.btnSecondaryBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  portfolioBadgePersonal: {
    backgroundColor: APP.btnSecondaryBg,
  },
  portfolioBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: APP.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  portfolioBadgeTextPersonal: {
    color: APP.textMuted,
  },
  client: {
    fontSize: 13,
    color: APP.textMuted,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '600',
    color: APP.text,
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
    color: APP.textMuted,
    textTransform: 'capitalize',
  },
});
