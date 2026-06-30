import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { LoadingScreen } from '@/components/LoadingScreen';
import { AppProviders } from '@/providers/AppProviders';
import { AuthProvider, useAuth } from '@/providers/AuthProvider';

SplashScreen.preventAutoHideAsync().catch(() => {
  /* Splash may already be hidden in dev fast refresh. */
});

function AuthGate() {
  const { user, loading, bootstrapping } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const isAppReady = !loading && !bootstrapping;

  useEffect(() => {
    if (isAppReady) {
      void SplashScreen.hideAsync();
    }
  }, [isAppReady]);

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

  if (loading) {
    return <LoadingScreen message="Starting UpperDeck" submessage="Restoring your session…" />;
  }

  if (bootstrapping) {
    return (
      <LoadingScreen
        message="Welcome back"
        submessage="Signing you in and loading your dashboard…"
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
        <Stack.Screen name="update/[id]" options={{ headerShown: true, title: 'Sunny update' }} />
        <Stack.Screen name="project/[id]" options={{ headerShown: true, title: 'Project' }} />
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
