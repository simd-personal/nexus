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

export function parseThemeMode(value: string | null): ThemeMode {
  return value === 'dark' ? 'dark' : 'light';
}

export function parseWarmthMode(value: string | null): WarmthMode {
  return value === 'on' ? 'on' : 'off';
}

export function readThemePreferences(): ThemePreferences {
  if (typeof window === 'undefined') {
    return DEFAULT_THEME_PREFERENCES;
  }

  return {
    theme: parseThemeMode(localStorage.getItem(THEME_STORAGE_KEY)),
    warmth: parseWarmthMode(localStorage.getItem(WARMTH_STORAGE_KEY)),
  };
}

export function applyThemePreferences(preferences: ThemePreferences): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  root.classList.toggle('dark', preferences.theme === 'dark');
  root.classList.toggle('warmth', preferences.warmth === 'on');
  root.dataset.theme = preferences.theme;
  root.dataset.warmth = preferences.warmth;
}

export function saveThemePreferences(preferences: ThemePreferences): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem(THEME_STORAGE_KEY, preferences.theme);
  localStorage.setItem(WARMTH_STORAGE_KEY, preferences.warmth);
  applyThemePreferences(preferences);
  window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: preferences }));
}

export const THEME_BOOTSTRAP_SCRIPT = `(function(){try{var d=document.documentElement;var t=localStorage.getItem('${THEME_STORAGE_KEY}');var w=localStorage.getItem('${WARMTH_STORAGE_KEY}');if(t==='dark'){d.classList.add('dark');d.dataset.theme='dark';}if(w==='on'){d.classList.add('warmth');d.dataset.warmth='on';}}catch(e){}})();`;
