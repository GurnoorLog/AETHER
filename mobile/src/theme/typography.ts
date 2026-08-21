import { Platform, type TextStyle } from 'react-native';

/**
 * Typography scale. Uses platform system fonts (no custom font assets) to keep
 * the default build zero-asset and fast to load. The `display` styles are intentionally
 * huge for the active-drill HUD.
 */

const systemFont = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'System',
});

const systemFontMono = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});

export const fontFamily = {
  base: systemFont,
  mono: systemFontMono,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  heavy: '800',
  black: '900',
} as const satisfies Record<string, TextStyle['fontWeight']>;

export const fontSize = {
  caption: 12,
  label: 14,
  body: 16,
  subtitle: 18,
  title: 22,
  heading: 28,
  display: 40,
  hero: 56,
  colossal: 88,
} as const;

export type TypographyVariant =
  | 'caption'
  | 'label'
  | 'body'
  | 'subtitle'
  | 'title'
  | 'heading'
  | 'display'
  | 'hero';

export const typography: Record<TypographyVariant, TextStyle> = {
  caption: { fontFamily: fontFamily.base, fontSize: fontSize.caption, fontWeight: fontWeight.medium, letterSpacing: 0.4 },
  label: { fontFamily: fontFamily.base, fontSize: fontSize.label, fontWeight: fontWeight.semibold, letterSpacing: 0.3 },
  body: { fontFamily: fontFamily.base, fontSize: fontSize.body, fontWeight: fontWeight.regular },
  subtitle: { fontFamily: fontFamily.base, fontSize: fontSize.subtitle, fontWeight: fontWeight.semibold },
  title: { fontFamily: fontFamily.base, fontSize: fontSize.title, fontWeight: fontWeight.bold },
  heading: { fontFamily: fontFamily.base, fontSize: fontSize.heading, fontWeight: fontWeight.heavy },
  display: { fontFamily: fontFamily.base, fontSize: fontSize.display, fontWeight: fontWeight.heavy },
  hero: { fontFamily: fontFamily.base, fontSize: fontSize.hero, fontWeight: fontWeight.black, letterSpacing: -0.5 },
};
