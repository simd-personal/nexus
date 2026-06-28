export const THEME_STORAGE_KEY = 'upperdeck-theme';
export const WARMTH_STORAGE_KEY = 'upperdeck-warmth';
export const THEME_CHANGE_EVENT = 'upperdeck-theme-change';

export type ThemeMode = 'light' | 'dark';
export type WarmthMode = 'on' | 'off';

export interface ThemePreferences {
  theme: ThemeMode;
  warmth: WarmthMode;
}

export const DEFAULT_THEME_PREFERENCES: ThemePreferences = {
  theme: 'light',
  warmth: 'off',
};

let themeSnapshot: ThemePreferences = DEFAULT_THEME_PREFERENCES;

export function parseThemeMode(value: string | null): ThemeMode {
  return value === 'dark' ? 'dark' : 'light';
}

export function parseWarmthMode(value: string | null): WarmthMode {
  return value === 'on' ? 'on' : 'off';
}

function readThemePreferencesFromStorage(): ThemePreferences {
  if (typeof window === 'undefined') {
    return DEFAULT_THEME_PREFERENCES;
  }

  return {
    theme: parseThemeMode(localStorage.getItem(THEME_STORAGE_KEY)),
    warmth: parseWarmthMode(localStorage.getItem(WARMTH_STORAGE_KEY)),
  };
}

function preferencesEqual(a: ThemePreferences, b: ThemePreferences): boolean {
  return a.theme === b.theme && a.warmth === b.warmth;
}

/** Stable snapshot for useSyncExternalStore — same object reference until values change. */
export function getThemePreferencesSnapshot(): ThemePreferences {
  if (typeof window === 'undefined') {
    return DEFAULT_THEME_PREFERENCES;
  }

  const next = readThemePreferencesFromStorage();
  if (preferencesEqual(next, themeSnapshot)) {
    return themeSnapshot;
  }

  themeSnapshot = next;
  return themeSnapshot;
}

export function readThemePreferences(): ThemePreferences {
  return getThemePreferencesSnapshot();
}

export function applyThemePreferences(preferences: ThemePreferences): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  root.classList.toggle('dark', preferences.theme === 'dark');
  root.classList.toggle('warmth', preferences.warmth === 'on');
  root.dataset.theme = preferences.theme;
  root.dataset.warmth = preferences.warmth;
}

function notifyThemePreferencesChanged(preferences: ThemePreferences): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: preferences }));
}

export function saveThemePreferences(preferences: ThemePreferences): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem(THEME_STORAGE_KEY, preferences.theme);
  localStorage.setItem(WARMTH_STORAGE_KEY, preferences.warmth);

  const changed = !preferencesEqual(preferences, themeSnapshot);
  themeSnapshot = preferences;
  applyThemePreferences(preferences);

  if (changed) {
    notifyThemePreferencesChanged(preferences);
  }
}

export function syncThemePreferences(): ThemePreferences {
  const preferences = getThemePreferencesSnapshot();
  applyThemePreferences(preferences);
  return preferences;
}

export const THEME_BOOTSTRAP_SCRIPT = `(function(){try{var d=document.documentElement;var t=localStorage.getItem('${THEME_STORAGE_KEY}');var w=localStorage.getItem('${WARMTH_STORAGE_KEY}');var dark=t==='dark';var warm=w==='on';d.classList.toggle('dark',dark);d.classList.toggle('warmth',warm);d.dataset.theme=dark?'dark':'light';d.dataset.warmth=warm?'on':'off';}catch(e){}})();`;
