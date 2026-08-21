/**
 * HalfTurn color system.
 *
 * Dark, high-contrast palette tuned for on-field glanceability: a player
 * moving with a ball should be able to read the active cue from a peripheral
 * glance. Cue "sides" and categories are color-coded so the meaning is legible
 * before the word is even read (left = cyan, right = orange, etc.).
 */

export const palette = {
  // Neutrals (blue-black base)
  ink900: '#070A0E',
  ink800: '#0B0F14',
  ink700: '#141B24',
  ink600: '#1C2630',
  ink500: '#27323D',
  ink400: '#3A4854',
  slate400: '#5E6E7C',
  slate300: '#9BAAB8',
  slate100: '#D7E0E8',
  white: '#F5F8FA',

  // Brand / accents
  teal: '#2DD4BF',
  cyan: '#22D3EE',
  orange: '#FB923C',
  lime: '#A3E635',
  rose: '#FB7185',
  red: '#F43F5E',
  purple: '#C084FC',
  amber: '#FACC15',
  green: '#34D399',
} as const;

export const colors = {
  // Surfaces
  background: palette.ink800,
  backgroundDeep: palette.ink900,
  surface: palette.ink700,
  surfaceAlt: palette.ink600,
  border: palette.ink500,
  borderStrong: palette.ink400,

  // Text
  textPrimary: palette.white,
  textSecondary: palette.slate300,
  textMuted: palette.slate400,
  onAccent: palette.ink900,

  // Brand
  primary: palette.teal,
  primaryMuted: 'rgba(45, 212, 191, 0.16)',

  // Semantic
  success: palette.green,
  danger: palette.red,
  warning: palette.amber,

  // Cue color-coding (mirrors CueCategory / Side — see constants/cues.ts)
  cueLeft: palette.cyan,
  cueRight: palette.orange,
  cueAction: palette.lime,
  cueAlert: palette.rose,
  cueVariableColor: palette.purple,
  cueVariableNumber: palette.amber,
  cueNeutral: palette.teal,
} as const;

export type ColorToken = keyof typeof colors;
