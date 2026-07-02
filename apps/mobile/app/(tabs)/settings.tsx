import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ErrorBoundaryProps } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { EmailForwardPanel } from '@/components/EmailForwardPanel';
import { MobileDataSecurityCard } from '@/components/MobileDataSecurityCard';
import { TabScreenHeader } from '@/components/BrandHeader';
import { RefreshableScroll } from '@/components/RefreshableScroll';
import { SwipeTabView } from '@/components/SwipeTabView';
import { Button, Card, Screen } from '@/components/ui';
import { deleteAccount, fetchAccountSummary } from '@/lib/api';
import { useAuth } from '@/providers/AuthProvider';
import { APP, BRAND, spacing } from '@/theme/colors';

const PLAN_CARD_COPY: Record<
  'Free' | 'Pro' | 'Enterprise',
  { icon: keyof typeof Ionicons.glyphMap; detail: string }
> = {
  Free: { icon: 'person-outline', detail: '$0 · 1 client project' },
  Pro: { icon: 'flash-outline', detail: '$39/mo · unlimited projects' },
  Enterprise: { icon: 'business-outline', detail: 'Custom plan for organizations' },
};

/** Small version of the signup plan tile — shows the account's current plan. */
function PlanCard({ plan }: { plan: 'Free' | 'Pro' | 'Enterprise' }) {
  const copy = PLAN_CARD_COPY[plan];
  // The label comes from the API — never crash the screen on an unknown value.
  if (!copy) return null;
  return (
    <View style={styles.planCard}>
      <View style={styles.planCardIcon}>
        <Ionicons name={copy.icon} size={18} color={APP.text} />
      </View>
      <View style={styles.planCardText}>
        <Text style={styles.planCardName}>{plan}</Text>
        <Text style={styles.planCardDetail}>{copy.detail}</Text>
      </View>
      <View style={styles.planCardCheck}>
        <Ionicons name="checkmark" size={14} color="#fff" />
      </View>
    </View>
  );
}

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

/** Route-level error boundary: a settings failure shows a retry card instead of crashing the app. */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <Screen>
      <View style={styles.errorWrap}>
        <Ionicons name="warning-outline" size={32} color={BRAND.danger} />
        <Text style={styles.errorTitle}>Settings hit a snag</Text>
        <Text style={styles.errorBody}>{error.message}</Text>
        <Button label="Try again" variant="secondary" onPress={() => void retry()} />
      </View>
    </Screen>
  );
}

const DELETE_WARNINGS = [
  'All projects, uploaded files, and generated documents',
  'All Sunny chat history and briefings',
  'Any active subscription — canceled immediately, no refund',
  'Your sign-in credentials and profile',
];

function DeleteAccountModal({
  visible,
  deleting,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [confirmText, setConfirmText] = useState('');
  const confirmed = confirmText.trim().toUpperCase() === 'DELETE';

  function close() {
    setConfirmText('');
    onCancel();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalBackdrop}
      >
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Delete account?</Text>
          <Text style={styles.modalWarning}>
            This is permanent and cannot be recovered. Deleting your account removes:
          </Text>
          <View style={styles.modalList}>
            {DELETE_WARNINGS.map((item) => (
              <View key={item} style={styles.modalListRow}>
                <Ionicons name="close-circle" size={16} color={BRAND.danger} />
                <Text style={styles.modalListText}>{item}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.modalInputLabel}>
            Type <Text style={styles.modalInputKeyword}>DELETE</Text> to confirm
          </Text>
          <TextInput
            value={confirmText}
            onChangeText={setConfirmText}
            autoCapitalize="characters"
            autoCorrect={false}
            autoComplete="off"
            placeholder="DELETE"
            placeholderTextColor={APP.textSubtle}
            editable={!deleting}
            style={styles.modalInput}
          />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Permanently delete account"
            onPress={onConfirm}
            disabled={!confirmed || deleting}
            style={[styles.modalDeleteButton, (!confirmed || deleting) && styles.modalDeleteButtonDisabled]}
          >
            {deleting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.modalDeleteLabel}>Permanently delete account</Text>
            )}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel deletion"
            onPress={close}
            disabled={deleting}
            style={({ pressed }) => [styles.modalCancelButton, pressed && styles.pressed]}
          >
            <Text style={styles.modalCancelLabel}>Cancel</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  // Scoped by user id so another account's cached summary can never render,
  // even if a cache wipe races sign-in.
  const accountQuery = useQuery({
    queryKey: ['account-summary', user?.id],
    queryFn: fetchAccountSummary,
    enabled: Boolean(user?.id),
  });

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        accountQuery.refetch(),
        queryClient.invalidateQueries({ queryKey: ['account-inbound'] }),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [accountQuery, queryClient]);

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      await deleteAccount();
      setDeleteModalVisible(false);
      // Clears the local session and stored biometric credentials.
      await signOut();
    } catch (error) {
      setDeleting(false);
      setDeleteModalVisible(false);
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
  const planLabel = accountQuery.data?.planLabel;
  const email = user?.email ?? '';

  return (
    <Screen>
    <SwipeTabView current="settings">
      <RefreshableScroll
        refreshing={refreshing}
        onRefresh={refresh}
        contentContainerStyle={styles.content}
        header={<TabScreenHeader title="Settings" subtitle="Manage your account and security" />}
      >
        <Card>
          <Text style={styles.cardLabel}>Account</Text>
          <SettingsRow
            icon="person-outline"
            title={displayName}
            description={
              [accountSubtitle, email].filter(Boolean).join(' · ') || 'UpperDeck account'
            }
          />
          {planLabel ? <PlanCard plan={planLabel} /> : null}
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
            onPress={() => setDeleteModalVisible(true)}
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

        <DeleteAccountModal
          visible={deleteModalVisible}
          deleting={deleting}
          onConfirm={() => void handleDeleteAccount()}
          onCancel={() => setDeleteModalVisible(false)}
        />
      </RefreshableScroll>
    </SwipeTabView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.md,
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
  planCard: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm + 2,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: APP.text,
    backgroundColor: APP.surfaceMuted,
  },
  planCardIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: APP.btnSecondaryBg,
  },
  planCardText: {
    flex: 1,
    gap: 1,
  },
  planCardName: {
    fontSize: 16,
    fontWeight: '700',
    color: APP.text,
    letterSpacing: -0.2,
  },
  planCardDetail: {
    fontSize: 13,
    lineHeight: 18,
    color: APP.textMuted,
  },
  planCardCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: APP.text,
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
  errorWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: APP.text,
  },
  errorBody: {
    fontSize: 13,
    lineHeight: 18,
    color: APP.textMuted,
    textAlign: 'center',
    marginBottom: spacing.sm,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 20, 24, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: APP.surface,
    borderRadius: 16,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: APP.text,
  },
  modalWarning: {
    fontSize: 14,
    lineHeight: 20,
    color: APP.textMuted,
  },
  modalList: {
    gap: 8,
    marginTop: 2,
    marginBottom: spacing.xs,
  },
  modalListRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  modalListText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: APP.textMuted,
  },
  modalInputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: APP.textSubtle,
  },
  modalInputKeyword: {
    fontWeight: '700',
    color: BRAND.danger,
  },
  modalInput: {
    backgroundColor: APP.surfaceMuted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: APP.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    fontSize: 16,
    letterSpacing: 1,
    color: APP.text,
  },
  modalDeleteButton: {
    marginTop: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: BRAND.danger,
  },
  modalDeleteButtonDisabled: {
    opacity: 0.45,
  },
  modalDeleteLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  modalCancelButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  modalCancelLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: APP.textMuted,
  },
});
