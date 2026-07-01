import { describe, expect, it } from 'vitest';
import { BRAND_FONT_FAMILY } from '@/lib/brand/typography';
import { OG_FONT_FAMILY, OG_IMAGE_SIZE } from '../og-image';

describe('og-image', () => {
  it('uses the brand font family for social previews', () => {
    expect(OG_FONT_FAMILY).toBe(BRAND_FONT_FAMILY);
    expect(OG_FONT_FAMILY).toBe('Plus Jakarta Sans');
  });

  it('keeps the standard Open Graph dimensions', () => {
    expect(OG_IMAGE_SIZE).toEqual({ width: 1200, height: 630 });
  });
});
