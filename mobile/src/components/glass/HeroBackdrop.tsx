import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { spacing, useTheme, type AccentKey, type GlassTheme } from '@/theme';

const { width: SCREEN_W } = Dimensions.get('window');

const COLS = 7;
const ROWS = 11;

/**
 * A calm pastel dot field. Each dot's base opacity peaks through the middle band
 * (behind the hero) and fades toward the top and bottom so the grid reads as
 * ambient depth, never as a texture the eye has to parse.
 */
const DOTS = Array.from({ length: ROWS }, (_, r) =>
  Array.from({ length: COLS }, (_, c) => ({
    key: `${r}-${c}`,
    cx: `${((c + 0.5) / COLS) * 100}%`,
    cy: `${((r + 0.5) / ROWS) * 100}%`,
    o: Math.max(0, 0.9 - Math.abs(r / (ROWS - 1) - 0.44) * 1.15),
  })),
).flat();

interface HeroBackdropProps {
  /** Tints the dot field toward the active section accent. */
  accent?: AccentKey;
  style?: StyleProp<ViewStyle>;
}

/**
 * Ambient depth behind the Home hero: a faint accent-tinted dot grid with a slow
 * diagonal light sweep drifting across it. Pure `react-native-svg` +
 * `react-native` Animated (no reanimated), driven natively. Subtle by design and
 * always behind content — it gives the pearl bloom a sense of parallax without
 * competing with the type.
 */
export function HeroBackdrop({ accent = 'home', style }: HeroBackdropProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const sweep = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(sweep, {
        toValue: 1,
        duration: 7200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [sweep]);

  const travel = SCREEN_W * 1.35;
  const translateX = sweep.interpolate({ inputRange: [0, 1], outputRange: [-travel, travel] });
  const dotColor = theme.accents[accent].solid;

  return (
    <View style={[styles.wrap, style]} pointerEvents="none">
      <Svg width="100%" height="100%">
        {DOTS.map((d) => (
          <Circle key={d.key} cx={d.cx} cy={d.cy} r={2} fill={dotColor} fillOpacity={d.o * 0.2} />
        ))}
      </Svg>
      <Animated.View style={[styles.sweep, { transform: [{ translateX }, { rotate: '18deg' }] }]}>
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.45)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

const makeStyles = (theme: GlassTheme) => StyleSheet.create({
  // Bleeds past the padded content column so the field reaches the screen edges.
  wrap: {
    position: 'absolute', top: 0, bottom: 0,
    left: -spacing.lg,
    right: -spacing.lg,
    overflow: 'hidden',
  },
  sweep: { position: 'absolute', top: '-40%', bottom: '-40%', width: 130, left: 0 },
});
