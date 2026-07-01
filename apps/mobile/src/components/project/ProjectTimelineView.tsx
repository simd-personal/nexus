import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { Card, EmptyState } from '@/components/ui';
import { formatRelativeTime } from '@/lib/format';
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

function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

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
                <Ionicons name={icon} size={16} color={BRAND.accent} />
              </View>
              {!isLast ? <View style={styles.line} /> : null}
            </View>

            <View style={styles.cardWrap}>
              <Card>
                <View style={styles.metaRow}>
                  <Text style={styles.date}>{formatEventDate(event.created_at)}</Text>
                  <Text style={styles.dot}>·</Text>
                  <Text style={styles.relative}>{formatRelativeTime(event.created_at)}</Text>
                </View>
                <View style={styles.typePill}>
                  <Text style={styles.typePillText}>{label}</Text>
                </View>
                <Text style={styles.title}>{event.title}</Text>
                {event.description ? (
                  <Text style={styles.description} numberOfLines={6}>
                    {event.description}
                  </Text>
                ) : null}
              </Card>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
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
    width: 32,
    alignItems: 'center',
    paddingTop: 2,
  },
  iconShell: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(37, 99, 235, 0.18)',
  },
  line: {
    flex: 1,
    width: 2,
    marginTop: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 1,
    minHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  date: {
    fontSize: 12,
    fontWeight: '600',
    color: BRAND.graphite,
  },
  relative: {
    fontSize: 12,
    color: BRAND.textMuted,
  },
  dot: {
    fontSize: 12,
    color: '#CBD5E1',
  },
  typePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: '#F8FAFC',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    marginBottom: 8,
  },
  typePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: BRAND.textMuted,
    textTransform: 'capitalize',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: BRAND.graphite,
    lineHeight: 21,
  },
  description: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 21,
    color: '#475569',
  },
});
