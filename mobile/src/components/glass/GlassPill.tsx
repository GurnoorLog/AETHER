import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { glassRadius, useTheme, type AccentKey, type GlassTheme } from '@/theme';
import { GlassSurface } from './GlassSurface';
import { Icon, type IconComponent } from './Icon';
import { Check } from './icons';

interface GlassPillProps {
  label: string;
  icon: IconComponent;
  selected: boolean;
  onPress: () => void;
  accent?: AccentKey;
  style?: StyleProp<ViewStyle>;
}

/**
 * A right-rail category lozenge: icon + short label with its own selection
 * state. Selected reads more opaque and accent-tinted with a filled check;
 * unselected is a quiet frosted lozenge with a hollow placeholder glyph.
 */
export function GlassPill({ label, icon, selected, onPress, accent = 'home', style }: GlassPillProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const solid = theme.accents[accent].solid;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }, style]}
    >
      <GlassSurface
        radius={glassRadius.lozenge}
        intensity={selected ? 'thick' : 'regular'}
        fill={selected ? theme.glass.fillStrong : theme.glass.fillSubtle}
        tintColor={selected ? theme.accents[accent].wash : undefined}
        style={styles.pill}
      >
        <View style={styles.badgeWrap}>
          {selected ? (
            <View style={[styles.badge, { backgroundColor: solid }]}>
              <Icon icon={Check} size={11} color={theme.light.white} strokeWidth={3} />
            </View>
          ) : (
            <View style={styles.badgeEmpty} />
          )}
        </View>
        <Icon icon={icon} size={22} color={selected ? solid : theme.light.inkMuted} strokeWidth={selected ? 2 : 1.75} />
        <Text style={[styles.label, { color: selected ? theme.light.ink : theme.light.inkMuted }]} numberOfLines={1}>
          {label}
        </Text>
      </GlassSurface>
    </Pressable>
  );
}

const makeStyles = (theme: GlassTheme) => StyleSheet.create({
  pill: { width: 70, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', gap: 7 },
  label: { ...theme.glassType.overline, fontSize: 9.5, letterSpacing: 0.8 },
  badgeWrap: { position: 'absolute', top: 8, right: 8 },
  badge: { width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  badgeEmpty: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: theme.dark ? 'rgba(255,255,255,0.22)' : 'rgba(24,20,37,0.14)',
  },
});
