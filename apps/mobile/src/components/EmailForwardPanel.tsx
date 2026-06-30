import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Button, Card } from '@/components/ui';
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
          <Text style={styles.label}>
            {props.mode === 'project' ? 'Project inbox' : 'Your smart inbox'}
          </Text>
          <View style={styles.addressRow}>
            <Text selectable style={styles.address}>
              {info.address}
            </Text>
          </View>
          <Button
            label={copied ? 'Copied' : 'Copy address'}
            variant="secondary"
            onPress={() => void copyAddress()}
          />

          <View style={styles.tipBox}>
            {props.mode === 'project' ? (
              <>
                <Text style={styles.tipText}>
                  In Outlook or Mail, forward an email to this address. Sunny saves the message and
                  attachments to this project automatically.
                </Text>
                <Text style={styles.tipHint}>
                  Using your smart inbox instead? Add{' '}
                  <Text style={styles.tipCode}>{info.subject_hint}</Text> to the subject.
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.tipText}>
                  Forward any email to your smart inbox. Include the client and project in the
                  subject, e.g. <Text style={styles.tipCode}>{info.subject_hint}</Text>
                </Text>
                <Text style={styles.tipHint}>
                  For one project every time, use that project&apos;s inbox address on the project
                  screen instead — no subject matching needed.
                </Text>
              </>
            )}
          </View>
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
  label: {
    marginTop: spacing.sm,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: BRAND.textMuted,
  },
  addressRow: {
    marginTop: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: BRAND.stone,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  address: {
    fontSize: 14,
    lineHeight: 20,
    color: BRAND.graphite,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
  tipBox: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: '#F8FAFC',
    gap: spacing.sm,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#475569',
  },
  tipHint: {
    fontSize: 13,
    lineHeight: 18,
    color: BRAND.textMuted,
  },
  tipCode: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    fontSize: 12,
    color: BRAND.graphite,
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
