import { LayoutAnimation } from 'react-native';

type LayoutConfig = Parameters<typeof LayoutAnimation.configureNext>[0];

export const duration = { fast: 160, base: 220, slow: 320 } as const;

export const layoutPresets = {
  fade: LayoutAnimation.create(duration.base, 'easeInEaseOut', 'opacity'),
  resize: LayoutAnimation.create(duration.base, 'easeInEaseOut', 'scaleXY'),
} as const;

export function animateNext(config: LayoutConfig = layoutPresets.fade): void {
  LayoutAnimation.configureNext(config);
}

export const motion = { duration, layout: layoutPresets } as const;
