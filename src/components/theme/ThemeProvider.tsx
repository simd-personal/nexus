'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from 'react';
import {
  DEFAULT_THEME_PREFERENCES,
  getThemePreferencesSnapshot,
  readThemePreferences,
  saveThemePreferences,
  THEME_CHANGE_EVENT,
  THEME_STORAGE_KEY,
  WARMTH_STORAGE_KEY,
  type ThemeMode,
  type ThemePreferences,
  type WarmthMode,
} from '@/lib/theme/preferences';

type ThemeContextValue = {
  preferences: ThemePreferences;
  darkMode: boolean;
  warmthOn: boolean;
  setTheme: (theme: ThemeMode) => void;
  setWarmth: (warmth: WarmthMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function subscribeToThemePreferences(onStoreChange: () => void) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  function handleStorage(event: StorageEvent) {
    if (event.key === THEME_STORAGE_KEY || event.key === WARMTH_STORAGE_KEY) {
      onStoreChange();
    }
  }

  function handleThemeChange() {
    onStoreChange();
  }

  function handlePageShow() {
    onStoreChange();
  }

  window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange);
  window.addEventListener('storage', handleStorage);
  window.addEventListener('pageshow', handlePageShow);

  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange);
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener('pageshow', handlePageShow);
  };
}

function getThemePreferencesServerSnapshot(): ThemePreferences {
  return DEFAULT_THEME_PREFERENCES;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const preferences = useSyncExternalStore(
    subscribeToThemePreferences,
    getThemePreferencesSnapshot,
    getThemePreferencesServerSnapshot
  );

  const setTheme = useCallback((theme: ThemeMode) => {
    const next = { ...readThemePreferences(), theme };
    saveThemePreferences(next);
  }, []);

  const setWarmth = useCallback((warmth: WarmthMode) => {
    const next = { ...readThemePreferences(), warmth };
    saveThemePreferences(next);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      preferences,
      darkMode: preferences.theme === 'dark',
      warmthOn: preferences.warmth === 'on',
      setTheme,
      setWarmth,
    }),
    [preferences, setTheme, setWarmth]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemePreferences() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemePreferences must be used within ThemeProvider');
  }
  return context;
}
