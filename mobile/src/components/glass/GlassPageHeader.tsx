import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { glassRadius, hitSlop, spacing, useTheme, type AccentKey, type GlassTheme } from '@/theme';
import { GlassCluster } from './GlassCluster';
import { GlassSurface } from './GlassSurface';
import { Icon, type IconComponent } from './Icon';

export const PAGE_CHROME_SIZE = 40;

const ACTION_BORDER = 'rgba(24,20,37,0.14)';

interface GlassPageHeaderProps {
  title: string;
  actions?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function GlassPageHeader({ title, actions, style }: GlassPageHeaderProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <View style={[styles.row, style]}>
      <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
        {title}
      </Text>
      {actions ? (
        <GlassCluster spacing={16} style={styles.actions}>
          {actions}
        </GlassCluster>
      ) : null}
    </View>
  );
}

interface GlassActionPillProps {
  label: string;
  onPress: () => void;
  icon?: IconComponent;
  active?: boolean;
  accent?: AccentKey;
  danger?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
}

export function GlassActionPill({
  label,
  onPress,
  icon,
  active = false,
  accent = 'home',
  danger = false,
  disabled = false,
  accessibilityLabel,
}: GlassActionPillProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const solid = danger ? theme.accents.data.solid : theme.accents[accent].solid;
  const color = disabled ? theme.light.inkFaint : active || danger ? solid : theme.light.inkSoft;
  const edge = danger ? 'rgba(224,90,84,0.35)' : active ? `${solid}55` : theme.dark ? 'rgba(255,255,255,0.16)' : ACTION_BORDER;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled, selected: active }}
      style={({ pressed }) => [{ opacity: disabled ? 0.45 : pressed ? 0.8 : 1 }]}
    >
      <View style={[styles.actionEdge, { borderColor: edge }]}>
        <GlassSurface
          radius={glassRadius.pill}
          intensity={active ? 'thick' : 'regular'}
          fill={active || danger ? theme.glass.fillStrong : theme.dark ? theme.glass.fill : 'rgba(255,255,255,0.62)'}
          tintColor={active ? theme.accents[accent].wash : danger ? theme.accents.data.wash : undefined}
          bordered={false}
          style={styles.actionPill}
        >
          {icon ? <Icon icon={icon} size={15} color={color} strokeWidth={1.9} /> : null}
          <Text style={[styles.actionLabel, { color }]}>{label}</Text>
        </GlassSurface>
      </View>
    </Pressable>
  );
}

const makeStyles = (theme: GlassTheme) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.lg,
    minHeight: PAGE_CHROME_SIZE,
  },
  title: {
    ...theme.glassType.hero,
    flexShrink: 1,
    fontSize: 34,
    lineHeight: 38,
    fontWeight: Platform.select({ ios: '200', android: '300', default: '200' }) as TextStyle['fontWeight'],
    letterSpacing: -0.8,
    color: theme.light.ink,
  },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 },
  actionEdge: {
    borderRadius: glassRadius.pill,
    borderCurve: 'continuous',
    borderWidth: 1,
    overflow: 'hidden',
  },
  actionPill: {
    minHeight: PAGE_CHROME_SIZE - 2,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionLabel: { ...theme.glassType.label, fontSize: 14, fontWeight: '600', letterSpacing: 0.1 },
});
