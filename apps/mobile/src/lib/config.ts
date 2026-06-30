import Constants from 'expo-constants';

function normalizeBaseUrl(raw: string): string {
  return raw.replace(/\/$/, '');
}

export function getApiBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (configured) return normalizeBaseUrl(configured);

  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    return `http://${host}:3000`;
  }

  return 'http://localhost:3000';
}

export function getSupabaseUrl(): string {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  if (!url) {
    throw new Error('EXPO_PUBLIC_SUPABASE_URL is required');
  }
  return url;
}

export function getSupabaseAnonKey(): string {
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!key) {
    throw new Error('EXPO_PUBLIC_SUPABASE_ANON_KEY is required');
  }
  return key;
}
