/**
 * Tequila Sugar Skull light theme.
 *
 * Día de los Muertos × tequila palette: agave green, marigold orange,
 * tequila gold on a warm paper-white background. Sans typography aligns
 * with ansonpdr.com. Rainbow temperature cue preserved (hot=red, cold=blue).
 *
 * Tune `accent` to the exact Anson brand orange once shared.
 */
export const colors = {
  bg: '#FFFFFF',
  surface: '#FAF6EE',
  surfaceAlt: '#F1EADC',
  border: '#D9D0BD',
  text: '#14110D',
  textMuted: '#5A5247',
  textFaint: '#8A8378',

  accent: '#F26522',
  accentDark: '#C44E13',

  agave: '#2EA85C',
  marigold: '#F5B82E',

  gold: '#F5B82E',
  silver: '#B8B0A0',
  bronze: '#C26C2A',

  good: '#2EA85C',
  warn: '#F26522',
  bad: '#E0383E',

  hot: '#E0383E',
  warm: '#F26522',
  moderate: '#F5B82E',
  cool: '#2EA85C',
  cold: '#2563D8',
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
