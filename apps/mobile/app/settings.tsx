import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
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
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const accountQuery = useQuery({
    queryKey: ['account-summary'],
    queryFn: fetchAccountSummary,
  });

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
