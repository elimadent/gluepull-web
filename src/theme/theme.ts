/** Rugged dark theme tuned for high contrast and dirty-handed readability. */
export const colors = {
  bg: '#0E0F12',
  surface: '#181A1F',
  surfaceAlt: '#202329',
  border: '#2C3038',
  text: '#F5F7FA',
  textMuted: '#9AA3B2',
  textFaint: '#6B7280',

  // Brand / accents
  accent: '#FF7A1A', // hi-vis safety orange
  accentDark: '#C75B0E',

  // Ranking medals
  gold: '#FFC53D',
  silver: '#C7CCD4',
  bronze: '#D88A4A',

  // Status
  good: '#3DD66F',
  warn: '#FFB020',
  bad: '#FF4D4D',

  // Temperature band cues
  hot: '#FF4D2E',
  warm: '#FF9F1C',
  moderate: '#FFD23F',
  cool: '#3DB1FF',
  cold: '#5A7BFF',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 26,
  xxl: 34,
} as const;

/** Minimum touch target for gloved/dirty hands. */
export const touchTarget = 56;

export type ThemeColors = typeof colors;
