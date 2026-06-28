'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  readThemePreferences,
  saveThemePreferences,
  THEME_CHANGE_EVENT,
  type ThemeMode,
  type ThemePreferences,
  type WarmthMode,
} from '@/lib/theme/preferences';

export function useThemePreferences() {
  const [preferences, setPreferences] = useState<ThemePreferences>(() => readThemePreferences());

  useEffect(() => {
    setPreferences(readThemePreferences());

    function handleChange(event: Event) {
      const detail = (event as CustomEvent<ThemePreferences>).detail;
      if (detail) {
        setPreferences(detail);
        return;
      }
      setPreferences(readThemePreferences());
    }

    window.addEventListener(THEME_CHANGE_EVENT, handleChange);
    return () => window.removeEventListener(THEME_CHANGE_EVENT, handleChange);
  }, []);

  const setTheme = useCallback((theme: ThemeMode) => {
    const next = { ...readThemePreferences(), theme };
    saveThemePreferences(next);
    setPreferences(next);
  }, []);

  const setWarmth = useCallback((warmth: WarmthMode) => {
    const next = { ...readThemePreferences(), warmth };
    saveThemePreferences(next);
    setPreferences(next);
  }, []);

  return {
    preferences,
    darkMode: preferences.theme === 'dark',
    warmthOn: preferences.warmth === 'on',
    setTheme,
    setWarmth,
  };
}
