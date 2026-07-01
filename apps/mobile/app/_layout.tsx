import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { LoadingScreen } from '@/components/LoadingScreen';
import { stackDetailScreenOptions } from '@/navigation/stackHeaderOptions';
import { AppProviders } from '@/providers/AppProviders';
import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { JAKARTA_FONTS, installJakartaFont } from '@/theme/fonts';

// Default all Text/TextInput to Plus Jakarta Sans via defaultProps (safe under
// the New Architecture — no render patching). Applied before first render.
installJakartaFont();

SplashScreen.preventAutoHideAsync().catch(() => {
  /* Splash may already be hidden in dev fast refresh. */
});

/** Brief welcome overlay after sign-in / Face ID — not tied to data loading. */
const POST_SIGN_IN_WELCOME_MS = 1800;

function AuthGate() {
  const { user, loading, bootstrapping, setBootstrapping } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const inAuth = segments[0] === 'login';

  useEffect(() => {
    if (loading || !user || !bootstrapping) return;

    const timer = setTimeout(() => setBootstrapping(false), POST_SIGN_IN_WELCOME_MS);
    return () => clearTimeout(timer);
  }, [loading, user, bootstrapping, setBootstrapping]);

  useEffect(() => {
    if (loading || !user) return;
    if (inAuth) {
      router.replace('/(tabs)');
    }
  }, [loading, user, inAuth, router]);

  useEffect(() => {
    if (loading) return;
    if (!user && !inAuth) {
      router.replace('/login');
    }
  }, [loading, user, inAuth, router]);

  const showLoading = loading || bootstrapping || (Boolean(user) && inAuth);
  const signingIn = bootstrapping && !user;
  const welcomeBack = bootstrapping && Boolean(user);

  useEffect(() => {
    if (showLoading) return;
    void SplashScreen.hideAsync();
  }, [showLoading]);

  return (
    <>
      {!showLoading ? <StatusBar style="dark" /> : null}
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="login" options={{ animation: 'none' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
        <Stack.Screen name="project/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="update/[id]" options={stackDetailScreenOptions('Sunny update')} />
        <Stack.Screen name="action-item/[id]" options={stackDetailScreenOptions('Action item')} />
        <Stack.Screen name="action-items" options={stackDetailScreenOptions('Your action items')} />
        <Stack.Screen name="project/[id]" options={{ headerShown: false }} />
      </Stack>
      {showLoading ? (
        <View style={styles.loadingOverlay} pointerEvents="auto">
          <LoadingScreen
            message={
              loading ? 'Starting UpperDeck' : signingIn ? 'Signing in' : welcomeBack ? 'Welcome back' : 'Loading…'
            }
            submessage={
              loading
                ? 'Restoring your session…'
                : signingIn
                  ? 'Verifying your credentials…'
                  : undefined
            }
            progress={null}
            progressLabel={undefined}
          />
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
});

export default function RootLayout() {
  // Load the font assets; rendering is not blocked so routing always mounts.
  useFonts(JAKARTA_FONTS);

  return (
    <AuthProvider>
      <AppProviders>
        <AuthGate />
      </AppProviders>
    </AuthProvider>
  );
}
