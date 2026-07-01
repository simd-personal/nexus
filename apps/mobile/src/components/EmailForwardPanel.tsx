import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui';
import { fetchAccountInbound, fetchProjectInbound } from '@/lib/api';
import { BRAND, radius, spacing } from '@/theme/colors';

type EmailForwardPanelProps =
  | { mode: 'project'; projectId: string }
  | { mode: 'account' };

export function EmailForwardPanel(props: EmailForwardPanelProps) {
  const [copied, setCopied] = useState(false);

  const query = useQuery({
    queryKey:
      props.mode === 'project'
        ? ['project-inbound', props.projectId]
        : ['account-inbound'],
    queryFn: () =>
      props.mode === 'project'
        ? fetchProjectInbound(props.projectId)
        : fetchAccountInbound(),
    enabled: props.mode === 'account' || Boolean(props.projectId),
  });

  const info = query.data;

  async function copyAddress() {
    if (!info?.address) return;
    await Clipboard.setStringAsync(info.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const title = props.mode === 'project' ? 'Forward from email' : 'Email forwarding';
  const description =
    props.mode === 'project'
      ? 'Forward emails and attachments directly to this project.'
      : 'Forward to one address for all projects. UpperDeck routes by subject line.';

  return (
    <Card>
      <View style={styles.headerRow}>
        <View style={styles.headerIcon}>
          <Ionicons name="mail-outline" size={20} color={BRAND.accent} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
      </View>

      {query.isError ? (
        <Text style={styles.error}>Could not load forwarding address.</Text>
      ) : query.isLoading || !info ? (
        <Text style={styles.loading}>Loading forwarding address…</Text>
      ) : (
        <>
          <View style={styles.addressHeader}>
            <Text style={styles.label}>
              {props.mode === 'project' ? 'Project inbox' : 'Your smart inbox'}
            </Text>
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

          <Pressable
            onPress={() => void copyAddress()}
            style={({ pressed }) => [styles.addressRow, pressed && styles.addressRowPressed]}
            accessibilityRole="button"
            accessibilityLabel={copied ? 'Address copied' : 'Copy forwarding address'}
          >
            <Text selectable style={styles.address}>
              {info.address}
            </Text>
          </Pressable>

          <Text style={styles.tipText}>
            {props.mode === 'project'
              ? 'Forward from Outlook or Mail — Sunny saves the message and attachments here automatically.'
              : `Forward any email here. Include client and project in the subject, e.g. ${info.subject_hint}.`}
          </Text>
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: BRAND.graphite,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: BRAND.textMuted,
  },
  addressHeader: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: BRAND.textMuted,
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
  addressRow: {
    marginTop: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: BRAND.stone,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  addressRowPressed: {
    opacity: 0.88,
  },
  address: {
    fontSize: 14,
    lineHeight: 20,
    color: BRAND.graphite,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
  tipText: {
    marginTop: spacing.sm,
    fontSize: 13,
    lineHeight: 18,
    color: BRAND.textMuted,
  },
  loading: {
    marginTop: spacing.sm,
    fontSize: 14,
    color: BRAND.textMuted,
  },
  error: {
    marginTop: spacing.sm,
    fontSize: 14,
    color: BRAND.danger,
  },
});
