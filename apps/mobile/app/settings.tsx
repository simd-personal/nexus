import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Button, Card, Screen } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';
import { BRAND, radius, spacing } from '@/theme/colors';

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
        <Ionicons name={icon} size={20} color={BRAND.accent} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        {description ? <Text style={styles.rowDescription}>{description}</Text> : null}
      </View>
      {onPress ? <Ionicons name="chevron-forward" size={18} color={BRAND.textMuted} /> : null}
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

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Settings"
          subtitle="Manage your account and security"
          rightAction={
            <Pressable
              onPress={() => router.back()}
              hitSlop={8}
              style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Close settings"
            >
              <Ionicons name="close" size={22} color={BRAND.graphite} />
            </Pressable>
          }
        />

        <Card>
          <Text style={styles.cardLabel}>Account</Text>
          <SettingsRow
            icon="person-outline"
            title={user?.email ?? 'Signed in'}
            description="Your UpperDeck account email"
          />
        </Card>

        <Card>
          <Text style={styles.cardLabel}>Session</Text>
          <Text style={styles.cardHint}>End your session on this device.</Text>
          <Button label="Sign out" variant="secondary" onPress={() => void signOut()} />
        </Card>

        <Card>
          <Text style={styles.cardLabel}>Security & privacy</Text>
          <View style={styles.bulletList}>
            <Text style={styles.bullet}>• API keys stay server-side and are never exposed to the app</Text>
            <Text style={styles.bullet}>• Row Level Security limits data to authorized users</Text>
            <Text style={styles.bullet}>• Use the web app for password changes and billing</Text>
          </View>
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
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  pressed: {
    opacity: 0.75,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: BRAND.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardHint: {
    fontSize: 14,
    lineHeight: 20,
    color: BRAND.textMuted,
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
    backgroundColor: '#EEF2FF',
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: BRAND.graphite,
  },
  rowDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: BRAND.textMuted,
  },
  bulletList: {
    gap: 8,
  },
  bullet: {
    fontSize: 14,
    lineHeight: 20,
    color: '#475569',
  },
});
