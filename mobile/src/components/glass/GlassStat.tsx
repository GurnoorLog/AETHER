import { useMemo } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme, type AccentKey, type GlassTheme } from '@/theme';
import { mixHex } from '@/lib/color';

type StatSize = 'sm' | 'md' | 'lg';

interface GlassStatProps {
  value: string;
  label: string;
  /** Colors the numeral; defaults to ink. */
  accent?: AccentKey;
  /** Or pass an explicit color (e.g. a cue color). */
  color?: string;
  size?: StatSize;
  align?: 'left' | 'center';
  style?: StyleProp<ViewStyle>;
}

const NUMERAL_SIZE: Record<StatSize, number> = { sm: 26, md: 34, lg: 50 };

/**
 * The reference's signature readout: a large light-weight numeral over a small
 * wide-tracked uppercase label. The one place big numbers earn their size.
 */
export function GlassStat({ value, label, accent, color, size = 'md', align = 'left', style }: GlassStatProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const accentSolid = accent ? theme.accents[accent].solid : theme.light.ink;
  const numeralColor = color ?? (theme.dark ? mixHex(accentSolid, '#FFFFFF', 0.55) : accentSolid);
  return (
    <View style={[align === 'center' ? styles.center : styles.left, style]}>
      <Text
        style={[theme.glassType.numeral, { fontSize: NUMERAL_SIZE[size], color: numeralColor }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.6}
      >
        {value}
      </Text>
      <Text style={styles.label} numberOfLines={1}>{label}</Text>
    </View>
  );
}

const makeStyles = (theme: GlassTheme) => StyleSheet.create({
  left: { alignItems: 'flex-start' },
  center: { alignItems: 'center' },
  label: { ...theme.glassType.overline, fontSize: 9, letterSpacing: 1.0, marginTop: 3 },
});
