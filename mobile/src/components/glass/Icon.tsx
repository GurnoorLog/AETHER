import type { ComponentType } from 'react';

import { useTheme } from '@/theme';

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

export function Icon({ icon: Glyph, size = 22, color, strokeWidth = 1.75 }: IconProps) {
  const { theme } = useTheme();
  const resolvedColor = color ?? theme.light.inkSoft;
  return <Glyph size={size} color={resolvedColor} strokeWidth={strokeWidth} absoluteStrokeWidth />;
}
