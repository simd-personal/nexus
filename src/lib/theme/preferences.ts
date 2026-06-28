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

export function syncThemePreferences(): ThemePreferences {
  const preferences = readThemePreferences();
  applyThemePreferences(preferences);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: preferences }));
  }
  return preferences;
}

export const THEME_BOOTSTRAP_SCRIPT = `(function(){try{var d=document.documentElement;var t=localStorage.getItem('${THEME_STORAGE_KEY}');var w=localStorage.getItem('${WARMTH_STORAGE_KEY}');var dark=t==='dark';var warm=w==='on';d.classList.toggle('dark',dark);d.classList.toggle('warmth',warm);d.dataset.theme=dark?'dark':'light';d.dataset.warmth=warm?'on':'off';}catch(e){}})();`;
