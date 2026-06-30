import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import {
  authenticateWithBiometrics,
  disableBiometricLogin,
  enableBiometricLogin,
  getBiometricAvailability,
  getStoredRefreshToken,
  isBiometricLoginEnabled,
  updateStoredRefreshToken,
} from '@/lib/biometric-auth';
import { supabase } from '@/lib/supabase';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  bootstrapping: boolean;
  setBootstrapping: (value: boolean) => void;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
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
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      setLoading(false);

      if (nextSession?.refresh_token && (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN')) {
        void updateStoredRefreshToken(nextSession.refresh_token);
      }
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

        const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
        if (error || !data.session) {
          await disableBiometricLogin();
          return { error: 'Biometric sign-in expired. Sign in with your password once.' };
        }

        await updateStoredRefreshToken(data.session.refresh_token);
        return {};
      },
      async signOut() {
        setBootstrapping(false);
        await supabase.auth.signOut();
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
