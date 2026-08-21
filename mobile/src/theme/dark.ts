/**
 * HalfTurn Liquid Glass — the DARK palette.
 *
 * Same token shapes as the light set in `./glass.ts`, tuned for a deep indigo
 * night world. Accents stay the same pastels (they pop on dark); only the
 * surface ramp, ink ramp, bloom, and glass material flip.
 */

import type { ViewStyle } from 'react-native';

/** Deep surface + light ink ramp (dark-on-light becomes light-on-dark). */
export const darkLight = {
  bloomWarm: '#191629',
  base: '#141122',
  mist: '#1D1933',
  white: '#FFFFFF',

  ink: '#F4F1FF', // primary text
  inkSoft: '#DAD4EE', // headings on glass
  inkMuted: 'rgba(255,255,255,0.66)', // secondary (labels, chips, status) — bright enough to read on dark
  inkFaint: 'rgba(255,255,255,0.50)', // captions / placeholders
  hairline: 'rgba(224,213,255,0.14)',
} as const;

/** Frosted-glass material tokens over the dark bloom. */
export const darkGlass = {
  // Lavender-tinted (not neutral white) so the glass keeps the indigo saturation —
  // neutral white over the dark bloom desaturates to flat gray. #D8CCFF-family alphas.
  fillSubtle: 'rgba(216,204,255,0.05)',
  fill: 'rgba(216,204,255,0.07)', // slightly deeper so white text pops off the card
  fillStrong: 'rgba(224,213,255,0.13)', // selected / emphasized (nav pill stays the lighter chrome)
  fillTinted: 'rgba(216,204,255,0.05)', // over a colored gradient

  border: 'rgba(235,226,255,0.22)', // luminous lavender hairline
  borderInk: 'rgba(235,226,255,0.10)',
  innerGlow: 'rgba(235,226,255,0.20)',

  blur: { thin: 26, regular: 48, thick: 74 } as const,
  // Subtle top-lit lavender sheen so dark glass reads as glass, not gray fog.
  sheen: ['rgba(236,229,255,0.14)', 'rgba(236,229,255,0.04)', 'rgba(236,229,255,0)'] as const,
} as const;

/** Whole-screen background: deep indigo sky fading to near-black plum. */
export const darkBloom = {
  colors: ['#2A2348', '#211B3C', '#191530', '#151227'] as const,
  locations: [0, 0.26, 0.56, 1] as const,
  start: { x: 0.5, y: 0 },
  end: { x: 0.5, y: 1 },
};

/** Periwinkle pool behind the nav — keep, slightly deeper for contrast. */
export const darkUnderglow = '#7C66C9';

/** Elevation shadows read softer on dark; reuse the same softness. */
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
