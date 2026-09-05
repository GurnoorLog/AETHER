
import type { ViewStyle } from 'react-native';

export const darkLight = {
  bloomWarm: '#232A22',
  base: '#141A14',
  mist: '#2A3328',
  white: '#FDFBF7',

  ink: '#F1EDE3', // primary text
  inkSoft: '#DAD4C6', // headings on glass
  inkMuted: 'rgba(241,237,227,0.66)', // secondary (labels, chips, status) — bright enough to read on dark
  inkFaint: 'rgba(241,237,227,0.50)', // captions / placeholders
  hairline: 'rgba(223,219,203,0.14)',
} as const;

export const darkGlass = {
  fillSubtle: 'rgba(216,205,180,0.06)',
  fill: 'rgba(216,205,180,0.08)', // slightly deeper so cream text pops off the card
  fillStrong: 'rgba(224,214,190,0.14)', // selected / emphasized (nav pill stays the lighter chrome)
  fillTinted: 'rgba(216,205,180,0.06)', // over a colored gradient

  border: 'rgba(235,225,200,0.22)', // luminous oat hairline
  borderInk: 'rgba(235,225,200,0.10)',
  innerGlow: 'rgba(235,225,200,0.20)',

  blur: { thin: 26, regular: 48, thick: 74 } as const,
  sheen: ['rgba(236,227,205,0.14)', 'rgba(236,227,205,0.04)', 'rgba(236,227,205,0)'] as const,
} as const;

export const darkBloom = {
  colors: ['#1E2A1C', '#1A2418', '#151C14', '#121710'] as const,
  locations: [0, 0.26, 0.56, 1] as const,
  start: { x: 0.5, y: 0 },
  end: { x: 0.5, y: 1 },
};

export const darkUnderglow = '#A15F22';

export const darkGlow = {
  card: {
    shadowColor: '#000000',
    shadowOpacity: 0.28,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  } satisfies ViewStyle,
  floating: {
    shadowColor: '#000000',
    shadowOpacity: 0.38,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 14 },
    elevation: 12,
  } satisfies ViewStyle,
} as const;
