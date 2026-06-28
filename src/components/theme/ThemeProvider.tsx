'use client';

import { useEffect } from 'react';
import { applyThemePreferences, readThemePreferences } from '@/lib/theme/preferences';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    applyThemePreferences(readThemePreferences());
  }, []);

  return children;
}
