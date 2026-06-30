import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { LoadingScreen } from '@/components/LoadingScreen';
import { prefetchDashboard } from '@/lib/prefetch';
import { stackDetailScreenOptions } from '@/navigation/stackHeaderOptions';
import { AppProviders } from '@/providers/AppProviders';
import { AuthProvider, useAuth } from '@/providers/AuthProvider';

SplashScreen.preventAutoHideAsync().catch(() => {
  /* Splash may already be hidden in dev fast refresh. */
});

function AuthGate() {
  const { user, loading, bootstrapping, setBootstrapping } = useAuth();
  const queryClient = useQueryClient();
  const segments = useSegments();
  const router = useRouter();
  const prefetchStartedRef = useRef(false);
  const [warmupDone, setWarmupDone] = useState(false);
  const [prefetchProgress, setPrefetchProgress] = useState<number | null>(null);
  const [prefetchLabel, setPrefetchLabel] = useState('Warming up Sunny…');

  useEffect(() => {
    if (loading) return;

    if (!user) {
      prefetchStartedRef.current = false;
      setWarmupDone(true);
      setPrefetchProgress(null);
      return;
    }

    if (prefetchStartedRef.current) return;
    prefetchStartedRef.current = true;
    setWarmupDone(false);
    setPrefetchProgress(0);
    setPrefetchLabel('Warming up Sunny…');

    void prefetchDashboard(queryClient, (completed, total, step) => {
      setPrefetchProgress(completed / total);
      setPrefetchLabel(step.label);
    }).finally(() => {
      setPrefetchProgress(1);
      setPrefetchLabel('Ready!');
      setWarmupDone(true);
      setBootstrapping(false);
    });
  }, [loading, user, queryClient, setBootstrapping]);

  const inAuth = segments[0] === 'login';

  // Keep the loading overlay until we've left login — otherwise the login form
  // flashes for a frame after prefetch completes and before router.replace runs.
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

  const showLoading =
    loading || bootstrapping || (Boolean(user) && !warmupDone) || (Boolean(user) && inAuth);

  useEffect(() => {
    if (showLoading) return;
    void SplashScreen.hideAsync();
  }, [showLoading]);

  const signingIn = bootstrapping && !user;

  return (
    <>
      {!showLoading ? <StatusBar style="dark" /> : null}
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="login" options={{ animation: 'none' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
        <Stack.Screen name="project/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="update/[id]" options={stackDetailScreenOptions('Sunny update')} />
        <Stack.Screen name="project/[id]" options={{ headerShown: false }} />
      </Stack>
      {showLoading ? (
        <View style={styles.loadingOverlay} pointerEvents="auto">
          <LoadingScreen
            message={loading ? 'Starting UpperDeck' : signingIn ? 'Signing in' : 'Welcome back'}
            submessage={
              loading ? 'Restoring your session…' : signingIn ? 'Verifying your credentials…' : undefined
            }
            progress={loading || signingIn ? null : prefetchProgress}
            progressLabel={loading || signingIn ? undefined : prefetchLabel}
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
  return (
    <AuthProvider>
      <AppProviders>
        <AuthGate />
      </AppProviders>
    </AuthProvider>
  );
}
