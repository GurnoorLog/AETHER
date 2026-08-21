/** 4pt spacing scale + radii. Keep layout rhythm consistent across screens. */

export const spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  huge: 64,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const hitSlop = { top: 12, bottom: 12, left: 12, right: 12 } as const;

export type Spacing = keyof typeof spacing;
export type Radius = keyof typeof radius;
