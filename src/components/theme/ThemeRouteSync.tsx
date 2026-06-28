'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { syncThemePreferences } from '@/lib/theme/preferences';

/** Re-apply saved theme on every client navigation so appearance never drifts. */
export function ThemeRouteSync() {
  const pathname = usePathname();

  useEffect(() => {
    syncThemePreferences();
  }, [pathname]);

  return null;
}
