import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '@/components/ui';
import { formatRelativeTime } from '@/lib/format';
import {
  compactTimelineSummary,
  timelineEventDetail,
  timelineEventIsExpandable,
} from '@/lib/timeline-summary';
import type { TimelineEvent } from '@/lib/types';
import { APP, spacing } from '@/theme/colors';

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

type ProjectTimelineViewProps = {
  events: TimelineEvent[];
  expandable?: boolean;
};

type TimelineEventCardProps = {
  event: TimelineEvent;
  label: string;
  expanded: boolean;
  expandable: boolean;
  onToggle: () => void;
};

function TimelineEventCard({
  event,
  label,
  expanded,
  expandable,
  onToggle,
}: TimelineEventCardProps) {
  const summary = expanded ? timelineEventDetail(event) : compactTimelineSummary(event);
  const showChevron = expandable;

  const content = (
    <>
      <View style={styles.metaRow}>
        <Text style={styles.meta} numberOfLines={1}>
          {label} · {formatRelativeTime(event.created_at)}
        </Text>
        {showChevron ? (
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={14}
            color={APP.textMuted}
            style={styles.chevron}
          />
        ) : null}
      </View>
      <Text style={styles.summary} numberOfLines={expanded ? undefined : 3}>
        {summary}
      </Text>
    </>
  );

  if (!expandable) {
    return <View style={styles.compactCard}>{content}</View>;
  }

  return (
    <Pressable
      onPress={onToggle}
      style={({ pressed }) => [styles.compactCard, pressed && styles.compactCardPressed]}
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      accessibilityLabel={`${label}. ${summary}`}
    >
      {content}
    </Pressable>
  );
}

export function ProjectTimelineView({ events, expandable = false }: ProjectTimelineViewProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());

  useFocusEffect(
    useCallback(() => {
      return () => setExpandedIds(new Set());
    }, [])
  );

  function toggleExpanded(eventId: string) {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(eventId)) next.delete(eventId);
      else next.add(eventId);
      return next;
    });
  }

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
        const canExpand = expandable && timelineEventIsExpandable(event);
        const isExpanded = expandedIds.has(event.id);

        return (
          <View key={event.id} style={styles.row}>
            <View style={styles.rail}>
              <View style={styles.iconShell}>
                <Ionicons name={icon} size={14} color={APP.textMuted} />
              </View>
              {!isLast ? <View style={styles.line} /> : null}
            </View>

            <View style={styles.cardWrap}>
              <TimelineEventCard
                event={event}
                label={label}
                expanded={isExpanded}
                expandable={canExpand}
                onToggle={() => toggleExpanded(event.id)}
              />
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
    backgroundColor: APP.btnSecondaryBg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: APP.border,
  },
  line: {
    flex: 1,
    width: 2,
    marginTop: 4,
    backgroundColor: APP.border,
    borderRadius: 1,
    minHeight: 12,
  },
  compactCard: {
    backgroundColor: APP.surface,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: APP.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  compactCardPressed: {
    opacity: 0.92,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: 4,
  },
  meta: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: APP.textMuted,
  },
  chevron: {
    marginTop: 1,
  },
  summary: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    color: APP.text,
  },
});
