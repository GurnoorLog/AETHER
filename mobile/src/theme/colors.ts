
export const palette = {
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
  background: palette.ink800,
  backgroundDeep: palette.ink900,
  surface: palette.ink700,
  surfaceAlt: palette.ink600,
  border: palette.ink500,
  borderStrong: palette.ink400,

  textPrimary: palette.white,
  textSecondary: palette.slate300,
  textMuted: palette.slate400,
  onAccent: palette.ink900,

  primary: palette.teal,
  primaryMuted: 'rgba(45, 212, 191, 0.16)',

  success: palette.green,
  danger: palette.red,
  warning: palette.amber,

  cueLeft: palette.cyan,
  cueRight: palette.orange,
  cueAction: palette.lime,
  cueAlert: palette.rose,
  cueVariableColor: palette.purple,
  cueVariableNumber: palette.amber,
  cueNeutral: palette.teal,
} as const;

export type ColorToken = keyof typeof colors;
