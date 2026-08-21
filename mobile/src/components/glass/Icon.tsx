import type { ComponentType } from 'react';

import { useTheme } from '@/theme';

/** Minimal shape of a Lucide icon component (avoids depending on lucide's exported types). */
export type IconComponent = ComponentType<{
  size?: number;
  color?: string;
  strokeWidth?: number;
  absoluteStrokeWidth?: boolean;
}>;

interface IconProps {
  icon: IconComponent;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

/**
 * One consistent stroke/size system for every icon in the glass world. Pass a
 * Lucide component (re-exported from `./icons`) rather than a string so the set
 * stays tree-shakeable. Default is a refined 1.75 hairline stroke on ink-soft.
 */
export function Icon({ icon: Glyph, size = 22, color, strokeWidth = 1.75 }: IconProps) {
  const { theme } = useTheme();
  const resolvedColor = color ?? theme.light.inkSoft;
  return <Glyph size={size} color={resolvedColor} strokeWidth={strokeWidth} absoluteStrokeWidth />;
}
