/** UpperDeck brand palette — single source of truth for colors. */
export const BRAND = {
  bgPrimary: '#0B1220',
  bgSecondary: '#1A2433',
  accent: '#2563EB',
  accentLight: '#3B82F6',
  accentDark: '#1D4ED8',
  success: '#10B981',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  border: '#334155',
} as const;

export type BrandColor = (typeof BRAND)[keyof typeof BRAND];
