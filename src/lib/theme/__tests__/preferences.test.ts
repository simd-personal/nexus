import { describe, expect, it, vi } from 'vitest';
import {
  getThemePreferencesSnapshot,
  parseThemeMode,
  parseWarmthMode,
  saveThemePreferences,
  syncThemePreferences,
  THEME_STORAGE_KEY,
  WARMTH_STORAGE_KEY,
} from '@/lib/theme/preferences';

describe('theme preferences', () => {
  it('parses stored theme values', () => {
    expect(parseThemeMode('dark')).toBe('dark');
    expect(parseThemeMode('light')).toBe('light');
    expect(parseThemeMode(null)).toBe('light');
  });

  it('parses stored warmth values', () => {
    expect(parseWarmthMode('on')).toBe('on');
    expect(parseWarmthMode('off')).toBe('off');
    expect(parseWarmthMode(null)).toBe('off');
  });

  it('returns a stable snapshot reference until preferences change', () => {
    const store = new Map<string, string>();
    const storage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
    };
    vi.stubGlobal('localStorage', storage);
    vi.stubGlobal('window', {
      localStorage: storage,
      dispatchEvent: vi.fn(),
    });
    vi.stubGlobal('document', {
      documentElement: {
        classList: { toggle: vi.fn() },
        dataset: {},
      },
    });

    store.set(THEME_STORAGE_KEY, 'light');
    store.set(WARMTH_STORAGE_KEY, 'off');

    const first = getThemePreferencesSnapshot();
    const second = getThemePreferencesSnapshot();
    expect(first).toBe(second);

    saveThemePreferences({ theme: 'dark', warmth: 'off' });
    const third = getThemePreferencesSnapshot();
    expect(third).not.toBe(first);
    expect(third.theme).toBe('dark');

    const fourth = getThemePreferencesSnapshot();
    expect(fourth).toBe(third);

    syncThemePreferences();
    const fifth = getThemePreferencesSnapshot();
    expect(fifth).toBe(fourth);

    vi.unstubAllGlobals();
  });
});
