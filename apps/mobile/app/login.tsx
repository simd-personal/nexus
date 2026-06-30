import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Button, Screen, Subtitle, Title } from '@/components/ui';
import { UpperDeckLogo } from '@/components/UpperDeckLogo';
import { useAuth } from '@/providers/AuthProvider';
import { BRAND, radius, spacing } from '@/theme/colors';

export default function LoginScreen() {
  const { signIn, setBootstrapping } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    setError(null);
    setBootstrapping(true);

    const result = await signIn(email.trim().toLowerCase(), password);
    if (result.error) {
      setBootstrapping(false);
      setError(result.error);
    }
  }

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <View style={styles.logoWrap}>
              <UpperDeckLogo size="md" />
              <Text style={styles.tagline}>Command Center</Text>
            </View>
            <Title>Your command center on iOS</Title>
            <Subtitle>Sunny briefings, critical items, and project chat — optimized for mobile.</Subtitle>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              placeholder="you@company.com"
              placeholderTextColor={BRAND.textMuted}
              style={styles.input}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              secureTextEntry
              autoComplete="password"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={BRAND.textMuted}
              style={styles.input}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button label="Sign in" onPress={handleSignIn} disabled={!email || !password} />
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
    gap: 6,
    marginBottom: spacing.sm,
  },
  tagline: {
    fontSize: 12,
    color: BRAND.textMuted,
  },
  form: {
    gap: spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND.graphite,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#D1D5DB',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 16,
    color: BRAND.graphite,
  },
  error: {
    color: BRAND.danger,
    fontSize: 14,
    marginTop: spacing.xs,
  },
});
