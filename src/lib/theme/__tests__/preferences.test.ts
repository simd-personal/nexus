import { describe, expect, it } from 'vitest';
import { describe, expect, it } from 'vitest';
import { parseThemeMode, parseWarmthMode } from '@/lib/theme/preferences';

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
});
