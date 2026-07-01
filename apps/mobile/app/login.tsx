import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInput as TextInputType,
} from 'react-native';
import { Button, Screen, Subtitle, Title } from '@/components/ui';
import { UpperDeckLogo } from '@/components/UpperDeckLogo';
import {
  getBiometricAvailability,
  getStoredBiometricEmail,
  isBiometricLoginEnabled,
  type BiometricAvailability,
} from '@/lib/biometric-auth';
import { useAuth } from '@/providers/AuthProvider';
import { APP, BRAND, radius, spacing } from '@/theme/colors';

export default function LoginScreen() {
  const { signIn, signInWithBiometric, setBootstrapping } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [biometric, setBiometric] = useState<BiometricAvailability & { enabled: boolean; storedEmail: string | null }>({
    available: false,
    label: 'Face ID',
    enabled: false,
    storedEmail: null,
  });

  const passwordRef = useRef<TextInputType>(null);

  async function loadBiometricState() {
    const [availability, enabled, storedEmail] = await Promise.all([
      getBiometricAvailability(),
      isBiometricLoginEnabled(),
      getStoredBiometricEmail(),
    ]);

    setBiometric({ ...availability, enabled, storedEmail });
    if (storedEmail) setEmail(storedEmail);
  }

  useEffect(() => {
    void loadBiometricState();
  }, []);

  async function handleSignIn() {
    setError(null);
    setSubmitting(true);
    setBootstrapping(true);

    const result = await signIn(email.trim().toLowerCase(), password);
    if (result.error) {
      setBootstrapping(false);
      setError(result.error);
    } else {
      await loadBiometricState();
    }

    setSubmitting(false);
  }

  async function handleBiometricSignIn() {
    setError(null);
    setBiometricLoading(true);
    setBootstrapping(true);

    const result = await signInWithBiometric();
    if (result.error) {
      setBootstrapping(false);
      setError(result.error);
      await loadBiometricState();
    }

    setBiometricLoading(false);
  }

  const showBiometric = biometric.available && biometric.enabled;

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
      >
          <View style={styles.hero}>
            <View style={styles.logoWrap}>
              <UpperDeckLogo size="md" />
            </View>
            <Title>Your command center on iOS</Title>
            <Subtitle>Sunny briefings, critical items, and project chat, optimized for mobile.</Subtitle>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Sign in</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="username"
                textContentType="username"
                keyboardType="email-address"
                keyboardAppearance="light"
                returnKeyType="next"
                blurOnSubmit={false}
                enablesReturnKeyAutomatically
                value={email}
                onChangeText={setEmail}
                onSubmitEditing={() => passwordRef.current?.focus()}
                placeholder="you@company.com"
                placeholderTextColor={APP.textSubtle}
                style={styles.input}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                ref={passwordRef}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                autoComplete="current-password"
                textContentType="password"
                keyboardAppearance="light"
                returnKeyType="go"
                enablesReturnKeyAutomatically
                value={password}
                onChangeText={setPassword}
                onSubmitEditing={() => {
                  if (email && password && !submitting) void handleSignIn();
                }}
                placeholder="Password"
                placeholderTextColor={APP.textSubtle}
                style={styles.input}
              />
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={styles.actions}>
              <Button
                label="Sign in"
                size="compact"
                onPress={() => void handleSignIn()}
                disabled={!email || !password}
                loading={submitting}
              />

              {showBiometric ? (
                <>
                  <Text style={styles.dividerText}>or</Text>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Sign in with ${biometric.label}`}
                    onPress={() => {
                      Keyboard.dismiss();
                      void handleBiometricSignIn();
                    }}
                    disabled={biometricLoading || submitting}
                    style={({ pressed }) => [
                      styles.biometricButton,
                      (biometricLoading || submitting) && styles.biometricButtonDisabled,
                      pressed && !biometricLoading && !submitting && styles.biometricButtonPressed,
                    ]}
                  >
                    <Ionicons
                      name={biometric.label === 'Face ID' ? 'scan-outline' : 'finger-print-outline'}
                      size={20}
                      color={APP.text}
                    />
                    <Text style={styles.biometricLabel}>
                      {biometricLoading ? 'Verifying…' : `Continue with ${biometric.label}`}
                    </Text>
                  </Pressable>

                  {biometric.storedEmail ? (
                    <Text style={styles.biometricHint}>{biometric.storedEmail}</Text>
                  ) : null}
                </>
              ) : null}
            </View>
          </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    justifyContent: 'center',
    gap: spacing.xl,
  },
  hero: {
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  logoWrap: {
    marginBottom: spacing.sm,
  },
  formCard: {
    backgroundColor: APP.surface,
    borderRadius: 14,
    padding: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: APP.border,
    gap: spacing.md,
    shadowColor: '#111418',
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  formTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: APP.text,
    letterSpacing: -0.2,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: APP.textSubtle,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    backgroundColor: APP.surfaceMuted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: APP.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
    fontSize: 17,
    color: APP.text,
  },
  error: {
    color: BRAND.danger,
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    marginTop: spacing.xs,
    gap: spacing.md,
    alignItems: 'center',
  },
  dividerText: {
    fontSize: 13,
    color: APP.textMuted,
    fontWeight: '500',
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: APP.btnSecondaryBg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: APP.btnSecondaryBorder,
  },
  biometricButtonDisabled: {
    opacity: 0.55,
  },
  biometricButtonPressed: {
    opacity: 0.85,
  },
  biometricLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: APP.btnSecondaryText,
  },
  biometricHint: {
    fontSize: 13,
    color: APP.textMuted,
    textAlign: 'center',
  },
});
