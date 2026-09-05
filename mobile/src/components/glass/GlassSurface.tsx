import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { glassRadius, useTheme } from '@/theme';
import { useGlassBlurTarget } from './GlassBlurContext';
import { getNativeGlass } from './liquidGlassNative';

type Intensity = 'thin' | 'regular' | 'thick';

export interface GlassSurfaceProps {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  radius?: number;
  intensity?: Intensity;
  glassStyle?: 'clear' | 'regular';
  interactive?: boolean;
  tintColor?: string;
  fill?: string;
  bordered?: boolean;
}

export function GlassSurface({
  children,
  style,
  radius = glassRadius.card,
  intensity = 'regular',
  glassStyle = 'regular',
  interactive = false,
  tintColor,
  fill,
  bordered = true,
}: GlassSurfaceProps) {
  const { theme } = useTheme();
  const shape: ViewStyle = { borderRadius: radius, borderCurve: 'continuous', overflow: 'hidden' };
  const border: ViewStyle | null = bordered
    ? { borderWidth: StyleSheet.hairlineWidth, borderColor: theme.glass.border }
    : null;

  const native = getNativeGlass();
  const blurTarget = useGlassBlurTarget();
  const androidBlur = Platform.OS === 'android' && blurTarget != null;
  if (native) {
    const { GlassView } = native;
    const resolvedTint = tintColor ?? fill;
    return (
      <GlassView
        glassEffectStyle={glassStyle}
        isInteractive={interactive}
        colorScheme="light"
        tintColor={resolvedTint}
        style={[shape, border, style]}
      >
        {children}
      </GlassView>
    );
  }

  return (
    <View style={[shape, border, style]}>
      <BlurView
        tint="light"
        intensity={theme.glass.blur[intensity]}
        blurMethod={androidBlur ? 'dimezisBlurViewSdk31Plus' : undefined}
        blurTarget={androidBlur ? blurTarget : undefined}
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: fill ?? theme.glass.fill }]} />
      {tintColor ? <View style={[StyleSheet.absoluteFill, { backgroundColor: tintColor }]} /> : null}
      {/* Top-lit sheen so the surface reads as glass. */}
      <LinearGradient
        colors={theme.glass.sheen}
        locations={[0, 0.5, 1]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}
