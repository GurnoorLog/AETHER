/**
 * HalfTurn Liquid Glass tokens — the LIGHT, high-key design language.
 *
 * This is a parallel token set to the dark `colors` in `./colors.ts`. The dark
 * palette still dresses the frozen live-drill layouts (tuned for outdoor
 * glanceability); everything the player touches *between* drills — Home,
 * Settings, History, Summary, the nav — lives in this bright frosted world so
 * the glass surfaces and pastel accents read the way the reference does.
 *
 * Accents are not arbitrary pastels: each one is keyed to a real part of the
 * drill (audio routing, TTS voice, cue vocabulary, field display) so the color
 * a section glows in still *means* something, the way the dark cue-coding does.
 */

import { Platform, type TextStyle, type ViewStyle } from 'react-native';

/** Light surface + ink ramp. The base the whole glass world sits on. */
export const light = {
  // Bloom / base surfaces (warm cream at the top fading to lavender mist)
  bloomWarm: '#FBF7F0',
  base: '#F6F2FA',
  mist: '#EDE7F6',
  white: '#FFFFFF',

  // Ink (dark-on-light text)
  ink: '#181425', // primary
  inkSoft: '#403A50', // headings on glass
  inkMuted: '#6D6780', // secondary
  inkFaint: '#9A94A8', // captions / placeholders
  hairline: 'rgba(24,20,37,0.08)', // faint dark edge for definition
} as const;

/** Frosted-glass material tokens (light tints that sit over the bloom). */
export const glass = {
  fillSubtle: 'rgba(255,255,255,0.36)',
  fill: 'rgba(255,255,255,0.55)',
  fillStrong: 'rgba(255,255,255,0.74)', // selected / emphasized
  fillTinted: 'rgba(255,255,255,0.30)', // over a colored gradient

  border: 'rgba(255,255,255,0.75)', // bright top-lit hairline
  borderInk: 'rgba(24,20,37,0.06)', // faint dark edge on very light bg
  innerGlow: 'rgba(255,255,255,0.9)',

  // BlurView intensities for the fallback path (0..100).
  blur: { thin: 26, regular: 48, thick: 74 } as const,
  // Top-lit sheen gradient painted over the blur so it reads as glass, not fog.
  sheen: ['rgba(255,255,255,0.55)', 'rgba(255,255,255,0.12)', 'rgba(255,255,255,0)'] as const,
} as const;

/** Continuous-corner radii for the squircle world. */
export const glassRadius = {
  chip: 16,
  lozenge: 26,
  card: 24,
  // Squircle corner. Kept squarer than a typical card radius so the big hero
  // surfaces (Home card, Profile avatar, launcher, history/summary heroes) read
  // as intentional rounded-squares, not pills. One value = one corner language.
  squircle: 20,
  pill: 999,
} as const;

/** Soft elevation for floating glass. Two levels: resting card, floating chrome. */
export const glow = {
  card: {
    shadowColor: '#2A2340',
    shadowOpacity: 0.08,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  } satisfies ViewStyle,
  floating: {
    shadowColor: '#251E3C',
    shadowOpacity: 0.14,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 14 },
    elevation: 12,
  } satisfies ViewStyle,
} as const;

/** Named accents. Each maps to a real section of the app. */
export type AccentKey = 'home' | 'audio' | 'voice' | 'vocab' | 'field' | 'feedback' | 'data';

interface Accent {
  /** Gradient stops, top-left → bottom-right. */
  gradient: readonly [string, string, ...string[]];
  /** Saturated solid for selected glyphs / accent text on light. */
  solid: string;
  /** Very soft wash used behind the section on the base background. */
  wash: string;
}

export const accents: Record<AccentKey, Accent> = {
  // Signature yellow → lavender bloom (the reference hero).
  home: { gradient: ['#FCEBA4', '#F2D9E6', '#CDBEF5', '#B7C3F4'], solid: '#8E77E6', wash: 'rgba(190,171,245,0.16)' },
  // Audio routing — mint → sky (teal cue family).
  audio: { gradient: ['#BEF3E4', '#A6D8F2'], solid: '#1FB49A', wash: 'rgba(45,212,191,0.14)' },
  // TTS voice — lilac → violet.
  voice: { gradient: ['#E7D8FB', '#C6B3F7'], solid: '#7C60E4', wash: 'rgba(160,133,246,0.16)' },
  // Cue vocabulary — butter → peach (amber cue family).
  vocab: { gradient: ['#FCE9A6', '#F7C9A0'], solid: '#D89A2E', wash: 'rgba(250,204,21,0.14)' },
  // Field display — sky → cornflower (cyan cue family).
  field: { gradient: ['#C3ECFB', '#AFC4F7'], solid: '#4386DE', wash: 'rgba(34,211,238,0.14)' },
  // Feedback — rose → lilac.
  feedback: { gradient: ['#FAD1E4', '#DCC7F5'], solid: '#DB5F9E', wash: 'rgba(251,113,133,0.14)' },
  // Data / destructive — coral → rose (still pastel, reads warm-caution).
  data: { gradient: ['#FBCBC0', '#F6B8C4'], solid: '#E05A54', wash: 'rgba(244,63,94,0.14)' },
};

/**
 * Whole-screen background: a lavender sky up top fading to warm pearl below, so
 * a bright over-exposed white bloom (painted separately in GlassScreen) can sit
 * on it the way the reference's ghosted hero does.
 */
export const bloom = {
  colors: ['#C9C3DF', '#E6E1F1', '#F2EFF6', '#EFECF5'] as const,
  locations: [0, 0.26, 0.56, 1] as const,
  start: { x: 0.5, y: 0 },
  end: { x: 0.5, y: 1 },
};

/** A soft periwinkle that pools next to the accent behind the nav (the merged blobs). */
export const underglowSecondary = '#A085F6';

const systemFont = Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' });
// SF has a true 200/ultralight; Roboto's thinnest available weight is 300 (Light),
// so map 200→300 on Android to keep the thin display look without a heavy fallback.
const thin = Platform.select<TextStyle['fontWeight']>({ ios: '200', android: '300', default: '200' });

/**
 * Light-context type. Leans on SF's ultralight weights for the big display
 * numerals + small wide-tracked uppercase overlines — the reference's
 * "21K / 29.60 · KM" treatment — while staying on the zero-asset system face.
 */
export const glassType = {
  hero: { fontFamily: systemFont, fontSize: 72, fontWeight: thin, letterSpacing: -1.5, color: light.ink },
  display: { fontFamily: systemFont, fontSize: 48, fontWeight: thin, letterSpacing: -0.8, color: light.ink },
  numeral: {
    fontFamily: systemFont,
    fontSize: 40,
    fontWeight: thin,
    letterSpacing: -0.5,
    color: light.ink,
    fontVariant: ['tabular-nums'],
  },
  title: { fontFamily: systemFont, fontSize: 24, fontWeight: '600', letterSpacing: -0.2, color: light.ink },
  subtitle: { fontFamily: systemFont, fontSize: 17, fontWeight: '600', color: light.inkSoft },
  body: { fontFamily: systemFont, fontSize: 15, fontWeight: '400', color: light.inkMuted },
  label: { fontFamily: systemFont, fontSize: 13, fontWeight: '600', letterSpacing: 0.2, color: light.inkSoft },
  overline: {
    fontFamily: systemFont,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: light.inkMuted,
  },
  caption: { fontFamily: systemFont, fontSize: 12, fontWeight: '500', letterSpacing: 0.2, color: light.inkFaint },
} as const satisfies Record<string, TextStyle>;

export const glassTheme = {
  light,
  glass,
  glassRadius,
  glow,
  accents,
  bloom,
  glassType,
} as const;
