import { BRAND as SHARED_BRAND } from '@upperdeck/shared/brand';

export const BRAND = SHARED_BRAND;

/**
 * Neutral Notion/Linear-inspired workspace palette — mirrors the web app tokens
 * in src/app/globals.css (--app-*). Mobile runs light-only.
 */
export const APP = {
  canvas: '#f7f7f8',
  surface: '#ffffff',
  surfaceMuted: '#fbfbfa',
  border: 'rgba(17, 20, 24, 0.07)',
  borderFaint: 'rgba(17, 20, 24, 0.05)',
  borderStrong: 'rgba(17, 20, 24, 0.11)',
  text: '#1f2328',
  textMuted: '#6b7280',
  textSubtle: '#9aa0aa',
  hover: 'rgba(17, 20, 24, 0.05)',
  accent: '#2563eb',
  // Buttons
  btnPrimaryBg: '#24292f',
  btnPrimaryBgPressed: '#32383f',
  btnPrimaryText: '#ffffff',
  btnSecondaryBg: '#f4f4f5',
  btnSecondaryBgPressed: '#ebebed',
  btnSecondaryBorder: 'rgba(17, 20, 24, 0.1)',
  btnSecondaryText: '#1f2328',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;
