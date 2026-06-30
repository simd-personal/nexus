/** UpperDeck brand palette — shared by web and mobile. */
export const BRAND = {
  bgPrimary: '#0B1220',
  bgSecondary: '#1A2433',
  bgElevated: '#243044',
  accent: '#2563EB',
  accentLight: '#3B82F6',
  accentDark: '#1D4ED8',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  border: '#334155',
  stone: '#F4F5F7',
  graphite: '#0E1115',
} as const;

export type BrandColor = (typeof BRAND)[keyof typeof BRAND];
