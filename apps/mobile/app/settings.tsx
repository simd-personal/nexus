import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { EmailForwardPanel } from '@/components/EmailForwardPanel';
import { MobileDataSecurityCard } from '@/components/MobileDataSecurityCard';
import { HeaderActions, HeaderIconButton, ScreenHeader } from '@/components/ScreenHeader';
import { Button, Card, Screen } from '@/components/ui';
import { deleteAccount, fetchAccountSummary } from '@/lib/api';
import { useAuth } from '@/providers/AuthProvider';
import { APP, BRAND, spacing } from '@/theme/colors';

function SettingsRow({
  icon,
  title,
  description,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  onPress?: () => void;
}) {
  const content = (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={20} color={APP.textMuted} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        {description ? <Text style={styles.rowDescription}>{description}</Text> : null}
      </View>
      {onPress ? <Ionicons name="chevron-forward" size={18} color={APP.textMuted} /> : null}
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
      {content}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const accountQuery = useQuery({
    queryKey: ['account-summary'],
    queryFn: fetchAccountSummary,
  });

  function confirmDeleteAccount() {
    Alert.alert(
      'Delete account?',
      'This permanently deletes your account, projects, files, and chat history. Any active subscription is canceled immediately without a refund. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete account',
          style: 'destructive',
          onPress: () => void handleDeleteAccount(),
        },
      ]
    );
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      await deleteAccount();
      // Clears the local session and stored biometric credentials.
      await signOut();
    } catch (error) {
      setDeleting(false);
      const message =
        error instanceof Error ? error.message : 'Could not delete your account. Try again.';
      Alert.alert('Deletion failed', message);
    }
  }

  const displayName =
    accountQuery.data?.displayName ??
    user?.user_metadata?.full_name?.trim() ??
    user?.email?.split('@')[0] ??
    'Your account';
  const accountSubtitle = accountQuery.data?.subtitle;
  const email = user?.email ?? '';

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <ScreenHeader
        title="Settings"
        subtitle="Manage your account and security"
        rightAction={
          <HeaderActions>
            <HeaderIconButton label="Close settings" icon="close" onPress={() => router.back()} />
          </HeaderActions>
        }
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card>
          <Text style={styles.cardLabel}>Account</Text>
          <SettingsRow
            icon="person-outline"
            title={displayName}
            description={
              [accountSubtitle, email].filter(Boolean).join(' · ') || 'UpperDeck account'
            }
          />
        </Card>

        <EmailForwardPanel mode="account" />

        <MobileDataSecurityCard />

        <Card>
          <Text style={styles.cardLabel}>Session</Text>
          <Text style={styles.cardHint}>End your session on this device.</Text>
          <Button label="Sign out" variant="secondary" onPress={() => void signOut()} />
        </Card>

        <Card>
          <Text style={styles.cardLabel}>More settings</Text>
          <View style={styles.bulletList}>
            <Text style={styles.bullet}>• Password, billing, and enterprise controls are in the web app</Text>
            <Text style={styles.bullet}>• Visit upperdeck.dev/settings on desktop for the full security panel</Text>
          </View>
        </Card>

        <Card>
          <Text style={styles.cardLabel}>Delete account</Text>
          <Text style={styles.cardHint}>
            Permanently removes your account, projects, files, and chat history. Active
            subscriptions are canceled immediately.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Delete account"
            onPress={confirmDeleteAccount}
            disabled={deleting}
            style={({ pressed }) => [
              styles.deleteButton,
              deleting && styles.deleteButtonDisabled,
              pressed && !deleting && styles.pressed,
            ]}
          >
            {deleting ? (
              <ActivityIndicator color={BRAND.danger} />
            ) : (
              <Text style={styles.deleteButtonLabel}>Delete account</Text>
            )}
          </Pressable>
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: APP.textSubtle,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardHint: {
    fontSize: 14,
    lineHeight: 20,
    color: APP.textMuted,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: APP.btnSecondaryBg,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: APP.text,
  },
  rowDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: APP.textMuted,
  },
  bulletList: {
    gap: 8,
  },
  bullet: {
    fontSize: 14,
    lineHeight: 20,
    color: APP.textMuted,
  },
  pressed: {
    opacity: 0.75,
  },
  deleteButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BRAND.danger,
  },
  deleteButtonDisabled: {
    opacity: 0.55,
  },
  deleteButtonLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: BRAND.danger,
  },
});
