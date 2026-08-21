/**
 * Theme factory: assembles the full Liquid Glass token bundle for a light or
 * dark palette. Consumers read the whole bundle through `useTheme()` so every
 * surface, ink, and type ramp can flip together.
 */

import { Platform, type TextStyle } from 'react-native';

import { accents, bloom, glass, glassRadius, glassType, glow, light, underglowSecondary } from './glass';
import { darkBloom, darkGlass, darkGlow, darkLight, darkUnderglow } from './dark';

const systemFont = Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' });
const thin = Platform.select<TextStyle['fontWeight']>({ ios: '200', android: '300', default: '200' });

/** Type ramp resolved against a given ink palette. */
function makeGlassType(ink: GlassPalette): GlassType {
  return {
    hero: { fontFamily: systemFont, fontSize: 72, fontWeight: thin, letterSpacing: -1.5, color: ink.ink },
    display: { fontFamily: systemFont, fontSize: 48, fontWeight: thin, letterSpacing: -0.8, color: ink.ink },
    numeral: {
      fontFamily: systemFont,
      fontSize: 40,
      fontWeight: thin,
      letterSpacing: -0.5,
      color: ink.ink,
      fontVariant: ['tabular-nums'],
    },
    title: { fontFamily: systemFont, fontSize: 24, fontWeight: '600', letterSpacing: -0.2, color: ink.ink },
    subtitle: { fontFamily: systemFont, fontSize: 17, fontWeight: '600', color: ink.inkSoft },
    body: { fontFamily: systemFont, fontSize: 15, fontWeight: '400', color: ink.inkMuted },
    label: { fontFamily: systemFont, fontSize: 13, fontWeight: '600', letterSpacing: 0.2, color: ink.inkSoft },
    overline: {
      fontFamily: systemFont,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1.6,
      textTransform: 'uppercase',
      color: ink.inkMuted,
    },
    caption: { fontFamily: systemFont, fontSize: 12, fontWeight: '500', letterSpacing: 0.2, color: ink.inkFaint },
  };
}

export type GlassPalette = {
  bloomWarm: string;
  base: string;
  mist: string;
  white: string;
  ink: string;
  inkSoft: string;
  inkMuted: string;
  inkFaint: string;
  hairline: string;
};

export type GlassMaterial = {
  fillSubtle: string;
  fill: string;
  fillStrong: string;
  fillTinted: string;
  border: string;
  borderInk: string;
  innerGlow: string;
  blur: { thin: number; regular: number; thick: number };
  sheen: readonly [string, string, string];
};

export type GlassBloom = {
  colors: readonly [string, string, string, string];
  locations: readonly [number, number, number, number];
  start: { x: number; y: number };
  end: { x: number; y: number };
};

export type GlassType = Record<keyof typeof glassType, TextStyle>;

export type GlassTheme = {
  light: GlassPalette;
  glass: GlassMaterial;
  glassRadius: typeof glassRadius;
  glow: typeof glow;
  accents: typeof accents;
  bloom: GlassBloom;
  underglowSecondary: string;
  glassType: GlassType;
  dark: boolean;
  /** Ink-tinted faint color (borders, tracks, chips) that flips for the palette. */
  inkEdge: (alpha: number) => string;
};

/** Build the token bundle for a palette. `dark: false` returns the light set exactly. */
export function makeGlassTheme(dark: boolean): GlassTheme {
  if (!dark) {
    return {
      light,
      glass,
      glassRadius,
      glow,
      accents,
      bloom,
      underglowSecondary,
      glassType,
      dark: false,
      inkEdge: (alpha: number) => `rgba(24,20,37,${alpha})`,
    };
  }
  return {
    light: darkLight,
    glass: darkGlass,
    glassRadius,
    glow: darkGlow,
    accents,
    bloom: darkBloom,
    underglowSecondary: darkUnderglow,
    glassType: makeGlassType(darkLight),
    dark: true,
    inkEdge: (alpha: number) => `rgba(255,255,255,${Math.min(alpha * 1.3, 0.35)})`,
  };
}
