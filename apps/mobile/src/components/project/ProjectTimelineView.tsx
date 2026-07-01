import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '@/components/ui';
import { formatRelativeTime } from '@/lib/format';
import { compactTimelineSummary } from '@/lib/timeline-summary';
import type { TimelineEvent } from '@/lib/types';
import { BRAND, radius, spacing } from '@/theme/colors';

const EVENT_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  meeting: 'calendar-outline',
  file_upload: 'document-text-outline',
  email: 'mail-outline',
  note: 'document-outline',
  sunny_summary: 'sunny-outline',
  critical_item: 'warning-outline',
  action_item: 'checkbox-outline',
  playbook: 'book-outline',
  follow_up_email: 'send-outline',
  contradiction: 'git-compare-outline',
  file_moved: 'arrow-forward-outline',
  file_shared: 'share-outline',
  file_replaced: 'swap-horizontal-outline',
};

const EVENT_LABELS: Record<string, string> = {
  meeting: 'Meeting',
  file_upload: 'Upload',
  email: 'Email',
  note: 'Note',
  sunny_summary: 'Sunny update',
  critical_item: 'Critical',
  action_item: 'Action',
  playbook: 'Playbook',
  follow_up_email: 'Follow up',
  contradiction: 'Conflict',
  file_moved: 'Moved',
  file_shared: 'Shared',
  file_replaced: 'Replaced',
};

export function ProjectTimelineView({ events }: { events: TimelineEvent[] }) {
  if (!events.length) {
    return (
      <EmptyState
        title="No timeline yet"
        body="Upload materials and Sunny will build a running history of what changed and why it matters."
      />
    );
  }

  return (
    <View style={styles.wrap}>
      {events.map((event, index) => {
        const icon = EVENT_ICONS[event.event_type] ?? 'ellipse-outline';
        const label = EVENT_LABELS[event.event_type] ?? event.event_type.replace(/_/g, ' ');
        const isLast = index === events.length - 1;

        return (
          <View key={event.id} style={styles.row}>
            <View style={styles.rail}>
              <View style={styles.iconShell}>
                <Ionicons name={icon} size={14} color={BRAND.accent} />
              </View>
              {!isLast ? <View style={styles.line} /> : null}
            </View>

            <View style={styles.cardWrap}>
              <View style={styles.compactCard}>
                <Text style={styles.meta} numberOfLines={1}>
                  {label} · {formatRelativeTime(event.created_at)}
                </Text>
                <Text style={styles.summary} numberOfLines={2}>
                  {compactTimelineSummary(event)}
                </Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.sm,
  },
  cardWrap: {
    flex: 1,
    minWidth: 0,
  },
  rail: {
    width: 28,
    alignItems: 'center',
    paddingTop: 2,
  },
  iconShell: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(37, 99, 235, 0.18)',
  },
  line: {
    flex: 1,
    width: 2,
    marginTop: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 1,
    minHeight: 12,
  },
  compactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  meta: {
    fontSize: 11,
    fontWeight: '600',
    color: BRAND.textMuted,
    marginBottom: 4,
  },
  summary: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    color: BRAND.graphite,
  },
});
