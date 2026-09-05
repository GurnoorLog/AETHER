
import { Platform, type TextStyle, type ViewStyle } from 'react-native';

export const light = {
  bloomWarm: '#FDFBF7',
  base: '#F7F2E8',
  mist: '#EFEAE0',
  white: '#FFFDF9',

  ink: '#2D3436', // primary
  inkSoft: '#3F4A41', // headings on glass
  inkMuted: '#555E61', // secondary
  inkFaint: '#A0A5A8', // captions / placeholders
  hairline: 'rgba(45,52,54,0.10)', // faint dark edge for definition
} as const;

export const glass = {
  fillSubtle: 'rgba(255,255,255,0.36)',
  fill: 'rgba(255,255,255,0.55)',
  fillStrong: 'rgba(255,255,255,0.74)', // selected / emphasized
  fillTinted: 'rgba(255,255,255,0.30)', // over a colored gradient

  border: 'rgba(255,255,255,0.75)', // bright top-lit hairline
  borderInk: 'rgba(24,20,37,0.06)', // faint dark edge on very light bg
  innerGlow: 'rgba(255,255,255,0.9)',

  blur: { thin: 26, regular: 48, thick: 74 } as const,
  sheen: ['rgba(255,255,255,0.55)', 'rgba(255,255,255,0.12)', 'rgba(255,255,255,0)'] as const,
} as const;

export const glassRadius = {
  chip: 16,
  lozenge: 26,
  card: 24,
  squircle: 20,
  pill: 999,
} as const;

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

export type AccentKey = 'home' | 'audio' | 'voice' | 'vocab' | 'field' | 'feedback' | 'data';

interface Accent {
  gradient: readonly [string, string, ...string[]];
  solid: string;
  wash: string;
}

export const accents: Record<AccentKey, Accent> = {
  home: { gradient: ['#F5E6C4', '#EDE3D0', '#E8E6D8', '#E4E6D5'], solid: '#3F5C3A', wash: 'rgba(63,92,58,0.14)' },
  audio: { gradient: ['#D9E8D2', '#C4DCC4'], solid: '#2F4A2D', wash: 'rgba(47,74,45,0.14)' },
  voice: { gradient: ['#F3D3B4', '#E8C49A'], solid: '#C9772E', wash: 'rgba(201,119,46,0.16)' },
  vocab: { gradient: ['#F5E3B0', '#F3D2A0'], solid: '#C99B2E', wash: 'rgba(201,155,46,0.16)' },
  field: { gradient: ['#CBE3EC', '#B9C9E8'], solid: '#5B8BB3', wash: 'rgba(91,139,179,0.16)' },
  feedback: { gradient: ['#F3C9B8', '#E8B9A6'], solid: '#C05A3E', wash: 'rgba(192,90,62,0.14)' },
  data: { gradient: ['#EFC4B6', '#E8AEAA'], solid: '#C05050', wash: 'rgba(192,80,80,0.14)' },
};

export const bloom = {
  colors: ['#EFE8DA', '#F5F0E3', '#FAF6EC', '#FBF8F0'] as const,
  locations: [0, 0.26, 0.56, 1] as const,
  start: { x: 0.5, y: 0 },
  end: { x: 0.5, y: 1 },
};

export const underglowSecondary = '#C9772E';

const systemFont = Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' });
const thin = Platform.select<TextStyle['fontWeight']>({ ios: '200', android: '300', default: '200' });

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
