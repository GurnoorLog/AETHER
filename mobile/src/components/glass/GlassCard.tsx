import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { glassRadius, spacing, useTheme, type GlassTheme } from '@/theme';
import { GlassSurface } from './GlassSurface';

interface GlassCardProps {
  children: ReactNode;
  /** Small uppercase overline label. */
  title?: string;
  subtitle?: string;
  style?: StyleProp<ViewStyle>;
  /** Trailing element in the header row (e.g. a value or control). */
  trailing?: ReactNode;
}

/** A frosted card that groups related controls, lifted off the bloom with a soft glow. */
export function GlassCard({ children, title, subtitle, style, trailing }: GlassCardProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <View style={[styles.shadow, style]}>
      <GlassSurface radius={glassRadius.card} intensity="regular" fill={theme.glass.fill} bordered={false} style={styles.card}>
        {title || trailing ? (
          <View style={styles.header}>
            <View style={styles.headerText}>
              {title ? <Text style={styles.title}>{title}</Text> : null}
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
            {trailing ?? null}
          </View>
        ) : null}
        {children}
      </GlassSurface>
    </View>
  );
}

const makeStyles = (theme: GlassTheme) => StyleSheet.create({
  shadow: { borderRadius: glassRadius.card, ...theme.glow.card },
  card: { padding: spacing.lg, gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md },
  headerText: { flex: 1, gap: 3 },
  title: { ...theme.glassType.overline },
  subtitle: { ...theme.glassType.caption },
});
