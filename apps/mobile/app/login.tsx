import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
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
import { BRAND, radius, spacing } from '@/theme/colors';

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

  useEffect(() => {
    void (async () => {
      const [availability, enabled, storedEmail] = await Promise.all([
        getBiometricAvailability(),
        isBiometricLoginEnabled(),
        getStoredBiometricEmail(),
      ]);

      setBiometric({ ...availability, enabled, storedEmail });
      if (storedEmail) setEmail(storedEmail);
    })();
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
      const enabled = await isBiometricLoginEnabled();
      setBiometric((current) => ({ ...current, enabled }));
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
    }

    setBiometricLoading(false);
  }

  const showBiometric = biometric.available && biometric.enabled;

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          <View style={styles.hero}>
            <View style={styles.logoWrap}>
              <UpperDeckLogo size="md" />
            </View>
            <Title>Your command center on iOS</Title>
            <Subtitle>Sunny briefings, critical items, and project chat — optimized for mobile.</Subtitle>
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
                placeholderTextColor={BRAND.textMuted}
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
                placeholderTextColor={BRAND.textMuted}
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
                  <View style={styles.dividerRow}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>or</Text>
                    <View style={styles.dividerLine} />
                  </View>

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
                      color={BRAND.accent}
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
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    padding: spacing.lg,
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
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    gap: spacing.md,
    shadowColor: BRAND.graphite,
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  formTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: BRAND.graphite,
    letterSpacing: -0.2,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: BRAND.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    backgroundColor: BRAND.cream,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
    fontSize: 17,
    color: BRAND.graphite,
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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    fontSize: 13,
    color: BRAND.textMuted,
    fontWeight: '500',
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: '#EEF2FF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#C7D2FE',
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
    color: BRAND.accent,
  },
  biometricHint: {
    fontSize: 13,
    color: BRAND.textMuted,
    textAlign: 'center',
  },
});
