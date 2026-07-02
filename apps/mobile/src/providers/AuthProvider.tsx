import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import {
  authenticateWithBiometrics,
  disableBiometricLogin,
  enableBiometricLogin,
  getBiometricAvailability,
  getStoredRefreshToken,
  isBiometricLoginEnabled,
  isPermanentRefreshTokenError,
  updateStoredRefreshToken,
} from '@/lib/biometric-auth';
import { getGoogleIdToken } from '@/lib/google-auth';
import { clearQueryCache, ensureQueryCacheOwner } from '@/lib/query-client';
import { supabase } from '@/lib/supabase';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  bootstrapping: boolean;
  setBootstrapping: (value: boolean) => void;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signInWithGoogle: () => Promise<{ error?: string; cancelled?: boolean }>;
  signInWithBiometric: () => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function persistBiometricSession(email: string, session: Session | null) {
  if (!session?.refresh_token) return;

  const { available } = await getBiometricAvailability();
  if (!available) return;

  await enableBiometricLogin(email, session.refresh_token);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [bootstrapping, setBootstrapping] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      // Wipe cached server data if it belongs to a different account, so a
      // previous user's data never flashes on screen.
      if (data.session?.user) {
        await ensureQueryCacheOwner(data.session.user.id);
      }
      setSession(data.session);
      if (data.session?.refresh_token) {
        void updateStoredRefreshToken(data.session.refresh_token);
      }
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((event, nextSession) => {
      void (async () => {
        if (event === 'SIGNED_OUT') {
          await clearQueryCache();
        } else if (nextSession?.user) {
          // Run before exposing the session so screens mount with a clean cache.
          await ensureQueryCacheOwner(nextSession.user.id);
        }

        setSession(nextSession);
        setLoading(false);

        if (nextSession?.refresh_token && (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN')) {
          void updateStoredRefreshToken(nextSession.refresh_token);
        }
      })();
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      bootstrapping,
      setBootstrapping,
      async signIn(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { error: error.message };

        await persistBiometricSession(email, data.session);
        return {};
      },
      async signInWithGoogle() {
        const result = await getGoogleIdToken();
        if ('cancelled' in result) return { cancelled: true };
        if ('error' in result) return { error: result.error };

        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: result.idToken,
        });
        if (error) return { error: error.message };

        if (data.user?.email) {
          await persistBiometricSession(data.user.email, data.session);
        }
        return {};
      },
      async signInWithBiometric() {
        const enabled = await isBiometricLoginEnabled();
        if (!enabled) {
          return { error: 'Biometric sign-in is not set up on this device.' };
        }

        const { label } = await getBiometricAvailability();
        const authResult = await authenticateWithBiometrics(`Sign in with ${label}`);
        if (!authResult.success) {
          if (authResult.error === 'user_cancel') return {};
          return { error: `${label} sign-in failed. Try your password.` };
        }

        const refreshToken = await getStoredRefreshToken();
        if (!refreshToken) {
          return { error: 'Biometric sign-in is not set up on this device.' };
        }

        // Drop any stale local session so refresh uses the biometric token cleanly.
        await supabase.auth.signOut({ scope: 'local' });

        const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
        if (error || !data.session) {
          if (isPermanentRefreshTokenError(error)) {
            await disableBiometricLogin();
            return { error: 'Biometric sign-in expired. Sign in with your password once.' };
          }
          return { error: 'Could not sign in. Check your connection and try again.' };
        }

        await updateStoredRefreshToken(data.session.refresh_token);
        return {};
      },
      async signOut() {
        setBootstrapping(false);
        await supabase.auth.signOut();
        await disableBiometricLogin();
      },
    }),
    [session, loading, bootstrapping]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
