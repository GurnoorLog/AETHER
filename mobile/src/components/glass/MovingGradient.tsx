import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { useTheme } from '@/theme';

/**
 * A slow, ambient aurora for the study environment: a few soft radial-glow
 * pools drift across the frame on independent loops. Each pool is a single SVG
 * radial gradient (already a dependency, used by GlassScreen) inside an
 * Animated.View whose transform animates on the native driver — no clipping
 * tricks, no per-frame JS layout. Sits behind the content; the white top-bloom
 * in GlassScreen keeps it soft and readable.
 */
export function MovingGradient({ active = true, style }: { active?: boolean; style?: ViewStyle }) {
  const { theme } = useTheme();
  const dim = theme.dark ? 0.5 : 1;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      <GlowPool active={active} id="a1" color="#CDBEF5" opacity={0.5 * dim} size={480} x={-140} y={-120} dx={90} dy={120} duration={13000} />
      <GlowPool active={active} id="a2" color="#A6D8F2" opacity={0.4 * dim} size={420} x={280} y={100} dx={-110} dy={-90} duration={16000} />
      <GlowPool active={active} id="a3" color="#F7C9A0" opacity={0.34 * dim} size={380} x={40} y={430} dx={110} dy={-90} duration={19000} />
    </View>
  );
}

interface GlowPoolProps {
  id: string;
  color: string;
  opacity: number;
  size: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  duration: number;
  active: boolean;
}

function GlowPool({ id, color, opacity, size, x, y, dx, dy, duration, active }: GlowPoolProps) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active) {
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(t, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [t, duration, active]);

  return (
    <Animated.View
      style={[
        styles.pool,
        {
          width: size,
          height: size,
          opacity,
          transform: [
            { translateX: t.interpolate({ inputRange: [0, 1], outputRange: [x, x + dx] }) },
            { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [y, y + dy] }) },
          ],
        },
      ]}
    >
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0" stopColor={color} stopOpacity={opacity} />
            <Stop offset="0.55" stopColor={color} stopOpacity={opacity * 0.35} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pool: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
