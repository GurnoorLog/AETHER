import { useMemo } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { glassRadius, hitSlop, useTheme, type AccentKey, type GlassTheme } from '@/theme';
import { GlassSurface } from './GlassSurface';
import { Icon, type IconComponent } from './Icon';

interface GlassIconButtonProps {
  icon: IconComponent;
  onPress?: () => void;
  size?: number;
  /** Emphasized/selected state: opaque fill + accent glyph. */
  active?: boolean;
  /** Accent for the active glyph color. */
  accent?: AccentKey;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
}

/** A circular frosted-glass icon button — the notification/settings/nav chrome. */
export function GlassIconButton({
  icon,
  onPress,
  size = 46,
  active = false,
  accent = 'home',
  accessibilityLabel,
  style,
}: GlassIconButtonProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const glyphColor = active ? theme.accents[accent].solid : theme.light.inkSoft;
  return (
    <Pressable
      onPress={onPress}
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }, style]}
    >
      <GlassSurface
        radius={glassRadius.pill}
        intensity={active ? 'thick' : 'regular'}
        fill={active ? theme.glass.fillStrong : theme.glass.fill}
        style={[styles.circle, { width: size, height: size }]}
      >
        <View style={styles.center}>
          <Icon icon={icon} size={size * 0.44} color={glyphColor} strokeWidth={active ? 2 : 1.75} />
        </View>
      </GlassSurface>
    </Pressable>
  );
}

const makeStyles = (theme: GlassTheme) => StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
  center: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
});
