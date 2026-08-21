/**
 * Shared motion language. One place for transition timing + reusable
 * `LayoutAnimation` presets, so every in-place content swap (Home section
 * switch, card resize, …) animates the same clean way instead of each screen
 * hand-rolling its own config.
 *
 * Tab-to-tab transitions are handled separately by React Navigation's built-in
 * `animation` option (see `app/(tabs)/_layout.tsx`), tuned to match `duration`.
 */
import { LayoutAnimation } from 'react-native';

type LayoutConfig = Parameters<typeof LayoutAnimation.configureNext>[0];

/** Transition durations (ms). Keep every animation on this scale. */
export const duration = { fast: 160, base: 220, slow: 320 } as const;

/** Named `LayoutAnimation` configs. `fade` is the default for swapping content. */
export const layoutPresets = {
  /** Soft cross-fade — swapping content in a fixed-size container. */
  fade: LayoutAnimation.create(duration.base, 'easeInEaseOut', 'opacity'),
  /** Ease + scale — when a container itself grows or shrinks. */
  resize: LayoutAnimation.create(duration.base, 'easeInEaseOut', 'scaleXY'),
} as const;

/** Queue a layout animation for the next state commit that changes layout. */
export function animateNext(config: LayoutConfig = layoutPresets.fade): void {
  LayoutAnimation.configureNext(config);
}

/** Grouped export for `theme.motion.*` consumers. */
export const motion = { duration, layout: layoutPresets } as const;
