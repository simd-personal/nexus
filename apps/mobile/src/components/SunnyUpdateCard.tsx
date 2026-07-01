import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui';
import { formatRelativeTime } from '@/lib/format';
import type { SunnyUpdate } from '@/lib/types';
import { BRAND, radius, spacing } from '@/theme/colors';

function CopyableCallout({ label, text }: { label: string; text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await Clipboard.setStringAsync(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Pressable
      onPress={() => void handleCopy()}
      style={({ pressed }) => [styles.callout, pressed && styles.calloutPressed]}
      accessibilityRole="button"
      accessibilityLabel={copied ? `${label} copied` : `Copy ${label}`}
    >
      <View style={styles.calloutHeader}>
        <Text style={styles.calloutLabel}>{label}</Text>
        <View style={styles.copyHint}>
          <Ionicons
            name={copied ? 'checkmark' : 'copy-outline'}
            size={14}
            color={copied ? BRAND.accent : BRAND.textMuted}
          />
          <Text style={[styles.copyHintText, copied && styles.copyHintTextCopied]}>
            {copied ? 'Copied' : 'Tap to copy'}
          </Text>
        </View>
      </View>
      <Text style={styles.calloutBody}>{text}</Text>
    </Pressable>
  );
}

function UpdateMeta({ update }: { update: SunnyUpdate }) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.timestamp}>{formatRelativeTime(update.created_at)}</Text>
    </View>
  );
}

export function SunnyUpdatePreviewCard({
  update,
  onPress,
}: {
  update: SunnyUpdate;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.previewWrap, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`Open update: ${update.title}`}
    >
      <Card>
        <View style={styles.previewHeader}>
          <Text style={styles.title} numberOfLines={2}>
            {update.title}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={BRAND.textMuted} />
        </View>

        <UpdateMeta update={update} />

        {update.project ? (
          <Text style={styles.project} numberOfLines={1}>
            {update.project.client_name} · {update.project.project_name}
          </Text>
        ) : null}

        <Text style={styles.summaryPreview} numberOfLines={3}>
          {update.summary}
        </Text>

        <Text style={styles.readMore}>Read full update</Text>
      </Card>
    </Pressable>
  );
}

export function SunnyUpdateDetailCard({ update }: { update: SunnyUpdate }) {
  return (
    <Card>
      <View style={styles.detailHeader}>
        <Text style={styles.title}>{update.title}</Text>
        <UpdateMeta update={update} />
      </View>

      {update.project ? (
        <Text style={styles.project}>
          {update.project.client_name} · {update.project.project_name}
        </Text>
      ) : null}

      <Text style={styles.summaryFull}>{update.summary}</Text>

      {update.why_it_matters ? (
        <CopyableCallout label="Why it matters" text={update.why_it_matters} />
      ) : null}

      {update.suggested_action ? (
        <CopyableCallout label="Suggested action" text={update.suggested_action} />
      ) : null}

      {update.source_citations?.length ? (
        <View style={styles.citations}>
          <Text style={styles.calloutLabel}>Sources</Text>
          {update.source_citations.map((citation, index) => (
            <View key={`${citation.file_name}-${index}`} style={styles.citationItem}>
              <Text style={styles.citationName}>{citation.file_name}</Text>
              {citation.snippet ? (
                <Text style={styles.citationSnippet}>{citation.snippet}</Text>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  previewWrap: {
    marginBottom: spacing.sm,
  },
  pressed: {
    opacity: 0.92,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  detailHeader: {
    gap: 4,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: BRAND.graphite,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 12,
    fontWeight: '500',
    color: BRAND.textMuted,
  },
  project: {
    fontSize: 13,
    color: BRAND.accent,
    fontWeight: '500',
  },
  summaryPreview: {
    fontSize: 14,
    lineHeight: 21,
    color: '#64748B',
  },
  summaryFull: {
    fontSize: 15,
    lineHeight: 23,
    color: '#334155',
  },
  readMore: {
    fontSize: 13,
    fontWeight: '600',
    color: BRAND.accent,
    marginTop: 2,
  },
  callout: {
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: 4,
  },
  calloutPressed: {
    opacity: 0.92,
  },
  calloutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  copyHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  copyHintText: {
    fontSize: 11,
    fontWeight: '600',
    color: BRAND.textMuted,
  },
  copyHintTextCopied: {
    color: BRAND.accent,
  },
  calloutLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: BRAND.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  calloutBody: {
    fontSize: 14,
    lineHeight: 21,
    color: '#334155',
  },
  citations: {
    gap: spacing.sm,
  },
  citationItem: {
    borderLeftWidth: 2,
    borderLeftColor: '#E5E7EB',
    paddingLeft: spacing.sm,
    gap: 2,
  },
  citationName: {
    fontSize: 13,
    fontWeight: '600',
    color: BRAND.graphite,
  },
  citationSnippet: {
    fontSize: 13,
    lineHeight: 19,
    color: BRAND.textMuted,
  },
});
