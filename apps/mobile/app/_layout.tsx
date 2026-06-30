import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
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
    if (loading || bootstrapping) return;
    void SplashScreen.hideAsync();
  }, [loading, bootstrapping]);

  useEffect(() => {
    if (loading || bootstrapping) return;
    const inAuth = segments[0] === 'login';

    if (!user && !inAuth) {
      router.replace('/login');
      return;
    }

    if (user && inAuth) {
      router.replace('/(tabs)');
    }
  }, [user, loading, bootstrapping, segments, router]);

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
    })
      .finally(() => {
        setPrefetchProgress(1);
        setPrefetchLabel('Ready!');
        setWarmupDone(true);
        setBootstrapping(false);
      });
  }, [loading, user, queryClient, setBootstrapping]);

  const showLoading = loading || bootstrapping || (Boolean(user) && !warmupDone);

  if (showLoading) {
    const signingIn = bootstrapping && !user;
    return (
      <LoadingScreen
        message={loading ? 'Starting UpperDeck' : signingIn ? 'Signing in' : 'Welcome back'}
        submessage={loading ? 'Restoring your session…' : signingIn ? 'Verifying your credentials…' : undefined}
        progress={loading || signingIn ? null : prefetchProgress}
        progressLabel={loading || signingIn ? undefined : prefetchLabel}
      />
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
        <Stack.Screen name="project/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="update/[id]" options={stackDetailScreenOptions('Sunny update')} />
        <Stack.Screen name="project/[id]" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppProviders>
        <AuthGate />
      </AppProviders>
    </AuthProvider>
  );
}
