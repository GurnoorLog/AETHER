import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { glassRadius, useTheme, type AccentKey } from '@/theme';

interface GradientSquircleProps {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Named section accent — its gradient fills the squircle. */
  accent?: AccentKey;
  /** Explicit gradient stops (overrides `accent`). */
  colors?: readonly [string, string, ...string[]];
  radius?: number;
  bordered?: boolean;
  start?: { x: number; y: number };
  end?: { x: number; y: number };
}

/**
 * A continuous-corner squircle filled with a rich directional gradient — the
 * reactive hero surface. Feed it an `accent` (or explicit `colors`) and it
 * shifts the whole card's mood; drop any content inside as a slot.
 */
export function GradientSquircle({
  children,
  style,
  accent = 'home',
  colors,
  radius = glassRadius.squircle,
  bordered = true,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
}: GradientSquircleProps) {
  const { theme } = useTheme();
  const stops = colors ?? theme.accents[accent].gradient;
  const shape: ViewStyle = { borderRadius: radius, borderCurve: 'continuous', overflow: 'hidden' };
  const border: ViewStyle | null = bordered
    ? { borderWidth: StyleSheet.hairlineWidth, borderColor: theme.glass.border }
    : null;
  return (
    <View style={[shape, border, style]}>
      <LinearGradient colors={stops} start={start} end={end} style={StyleSheet.absoluteFill} />
      {children}
    </View>
  );
}
