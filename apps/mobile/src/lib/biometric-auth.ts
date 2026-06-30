import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const ENABLED_KEY = 'upperdeck_biometric_enabled';
const EMAIL_KEY = 'upperdeck_biometric_email';
const REFRESH_TOKEN_KEY = 'upperdeck_biometric_refresh_token';

export type BiometricAvailability = {
  available: boolean;
  label: 'Face ID' | 'Touch ID' | 'Biometrics';
};

export async function getBiometricAvailability(): Promise<BiometricAvailability> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

  let label: BiometricAvailability['label'] = 'Biometrics';
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    label = 'Face ID';
  } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    label = 'Touch ID';
  }

  return { available: hasHardware && isEnrolled, label };
}

export async function isBiometricLoginEnabled(): Promise<boolean> {
  const [enabled, token] = await Promise.all([
    SecureStore.getItemAsync(ENABLED_KEY),
    SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
  ]);
  return enabled === 'true' && Boolean(token);
}

export async function getStoredBiometricEmail(): Promise<string | null> {
  return SecureStore.getItemAsync(EMAIL_KEY);
}

export async function getStoredRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function enableBiometricLogin(email: string, refreshToken: string): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(ENABLED_KEY, 'true'),
    SecureStore.setItemAsync(EMAIL_KEY, email),
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
  ]);
}

export async function disableBiometricLogin(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(ENABLED_KEY),
    SecureStore.deleteItemAsync(EMAIL_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
  ]);
}

export async function updateStoredRefreshToken(refreshToken: string): Promise<void> {
  const enabled = await SecureStore.getItemAsync(ENABLED_KEY);
  if (enabled === 'true') {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export async function authenticateWithBiometrics(promptMessage: string) {
  return LocalAuthentication.authenticateAsync({
    promptMessage,
    cancelLabel: 'Cancel',
    fallbackLabel: 'Use passcode',
  });
}

/** True when the refresh token is dead — not for transient network failures. */
export function isPermanentRefreshTokenError(error: {
  status?: number;
  code?: string;
  message?: string;
} | null): boolean {
  if (!error) return false;

  const permanentCodes = ['refresh_token_not_found', 'invalid_grant', 'session_not_found'];
  if (error.code && permanentCodes.includes(error.code)) return true;

  const message = (error.message ?? '').toLowerCase();
  if (
    message.includes('invalid refresh token') ||
    message.includes('refresh token not found') ||
    message.includes('session not found')
  ) {
    return true;
  }

  if (error.status === 400 || error.status === 401 || error.status === 403) {
    return message.includes('refresh') || message.includes('invalid') || message.includes('expired');
  }

  return false;
}
