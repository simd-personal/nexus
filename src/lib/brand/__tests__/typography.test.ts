import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  BRAND_FONT_CSS_VARIABLE,
  BRAND_FONT_FAMILY,
  DEPRECATED_BRAND_FONTS,
} from '../typography';

const repoRoot = resolve(__dirname, '../../../..');

describe('brand typography', () => {
  it('uses Plus Jakarta Sans as the single brand font family', () => {
    expect(BRAND_FONT_FAMILY).toBe('Plus Jakarta Sans');
    expect(BRAND_FONT_CSS_VARIABLE).toBe('--font-jakarta');
  });

  it('loads Plus Jakarta Sans from layout.tsx', () => {
    const layout = readFileSync(resolve(repoRoot, 'src/app/layout.tsx'), 'utf8');
    expect(layout).toContain('Plus_Jakarta_Sans');
    expect(layout).toContain("'--font-jakarta'");
    expect(layout).not.toMatch(/import\s*\{[^}]*\bInter\b/);
    expect(layout).not.toContain('Space_Grotesk');
    expect(layout).not.toContain('Cinzel');
  });

  it('does not reference deprecated fonts in globals.css', () => {
    const css = readFileSync(resolve(repoRoot, 'src/app/globals.css'), 'utf8');
    for (const font of DEPRECATED_BRAND_FONTS) {
      expect(css).not.toContain(font);
    }
    expect(css).toContain('var(--font-jakarta)');
    expect(css).toContain('.sunny-authority-tagline');
    expect(css).toMatch(/\.sunny-authority-tagline[\s\S]*font-style:\s*italic/);
    expect(css).not.toMatch(/\.sunny-authority-tagline[\s\S]*font-family:[^;]*Georgia/);
  });
});
