import { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { glassRadius, spacing, useTheme, type AccentKey, type GlassTheme } from '@/theme';
import { GlassSurface } from './GlassSurface';
import { Icon, type IconComponent } from './Icon';

type Variant = 'primary' | 'secondary' | 'danger';
type Size = 'md' | 'lg';

interface GlassButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  /** Fills a `primary` button with a section accent instead of ink. */
  accent?: AccentKey;
  icon?: IconComponent;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

const SIZES: Record<Size, { padV: number; font: number; icon: number }> = {
  md: { padV: 14, font: 16, icon: 18 },
  lg: { padV: 18, font: 19, icon: 20 },
};

/**
 * The action primitive. `primary` is a confident solid ink pill (echoing the
 * reference's dark Home circle); `secondary` is frosted glass; `danger` is the
 * warm coral accent. Pass `accent` to tint a primary button to a section color.
 */
export function GlassButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  accent,
  icon,
  disabled = false,
  loading = false,
  style,
}: GlassButtonProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const sz = SIZES[size];
  const isGlass = variant === 'secondary';
  const isInkPrimary = variant === 'primary' && !accent;
  // The default primary is the "ink" pill; in dark the ink flips light, so the
  // label flips to the dark base to keep contrast.
  const fg = isGlass ? theme.light.ink : isInkPrimary && theme.dark ? theme.light.base : theme.light.white;
  const solidBg = variant === 'danger' ? theme.accents.data.solid : accent ? theme.accents[accent].solid : theme.light.ink;

  const content = (
    <View style={styles.row}>
      {icon ? <Icon icon={icon} size={sz.icon} color={fg} strokeWidth={2} /> : null}
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text style={[styles.label, { color: fg, fontSize: sz.font }]}>{label}</Text>
      )}
    </View>
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [{ opacity: disabled ? 0.45 : pressed ? 0.85 : 1 }, style]}
    >
      {isGlass ? (
        <GlassSurface
          radius={glassRadius.card}
          intensity="regular"
          fill={theme.glass.fillStrong}
          style={[styles.base, { paddingVertical: sz.padV }]}
        >
          {content}
        </GlassSurface>
      ) : (
        <View style={[styles.base, { paddingVertical: sz.padV, borderRadius: glassRadius.card, backgroundColor: solidBg }]}>
          {content}
        </View>
      )}
    </Pressable>
  );
}

const makeStyles = (theme: GlassTheme) => StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  label: { fontWeight: '600', letterSpacing: 0.2 },
});
