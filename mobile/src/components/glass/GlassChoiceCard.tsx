import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { glassRadius, useTheme, type AccentKey, type GlassTheme } from '@/theme';
import { GlassSurface } from './GlassSurface';
import { Icon, type IconComponent } from './Icon';
import { Check } from './icons';

interface GlassChoiceCardProps {
  icon: IconComponent;
  title: string;
  /** Plain-English line describing what picking this option does. */
  description: string;
  selected: boolean;
  onPress: () => void;
  accent?: AccentKey;
  style?: StyleProp<ViewStyle>;
}

/**
 * A single-select option as a card: an accent icon chip, a title, and a
 * plain-English description of what the option does, with a check when chosen.
 * Richer than a segmented pill — each choice explains itself. Selected reads as a
 * brighter, accent-tinted card with an accent ring and a filled check.
 */
export function GlassChoiceCard({
  icon,
  title,
  description,
  selected,
  onPress,
  accent = 'home',
  style,
}: GlassChoiceCardProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const solid = theme.accents[accent].solid;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={title}
      style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }, style]}
    >
      <GlassSurface
        radius={glassRadius.squircle}
        intensity={selected ? 'thick' : 'regular'}
        fill={selected ? theme.glass.fillStrong : theme.glass.fillSubtle}
        tintColor={selected ? theme.accents[accent].wash : undefined}
        style={[styles.card, selected && { borderColor: solid, borderWidth: 1.5 }]}
      >
        <View style={[styles.iconChip, { backgroundColor: selected ? theme.accents[accent].wash : theme.dark ? theme.glass.fill : 'rgba(255,255,255,0.5)' }]}>
          <Icon icon={icon} size={20} color={selected ? solid : theme.light.inkMuted} strokeWidth={selected ? 2 : 1.75} />
        </View>
        <View style={styles.text}>
          <Text style={[styles.title, { color: selected ? theme.light.ink : theme.light.inkSoft }]}>{title}</Text>
          <Text style={styles.desc}>{description}</Text>
        </View>
        <View style={selected ? [styles.badge, { backgroundColor: solid }] : styles.ring}>
          {selected ? <Icon icon={Check} size={12} color={theme.light.white} strokeWidth={3} /> : null}
        </View>
      </GlassSurface>
    </Pressable>
  );
}

const makeStyles = (theme: GlassTheme) => StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  iconChip: { width: 40, height: 40, borderRadius: 12, borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 2 },
  title: { ...theme.glassType.subtitle, fontSize: 16 },
  desc: { ...theme.glassType.caption, color: theme.light.inkMuted, lineHeight: 16 },
  badge: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  ring: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: theme.dark ? 'rgba(255,255,255,0.25)' : 'rgba(24,20,37,0.18)' },
});
