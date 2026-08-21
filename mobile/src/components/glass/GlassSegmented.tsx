import { useMemo } from 'react';
import { LayoutAnimation, Platform, Pressable, StyleSheet, Text, UIManager, View } from 'react-native';

import { glassRadius, useTheme, type AccentKey, type GlassTheme } from '@/theme';
import { GlassSurface } from './GlassSurface';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export interface GlassSegmentOption<T> {
  label: string;
  value: T;
}

interface GlassSegmentedProps<T> {
  options: GlassSegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  accent?: AccentKey;
}

/** A frosted segmented control; the selected segment lifts to an opaque pill. */
export function GlassSegmented<T extends string | number>({
  options,
  value,
  onChange,
  accent = 'home',
}: GlassSegmentedProps<T>) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const select = (v: T) => {
    LayoutAnimation.configureNext(LayoutAnimation.create(160, 'easeInEaseOut', 'opacity'));
    onChange(v);
  };
  return (
    <GlassSurface radius={glassRadius.pill} intensity="regular" fill={theme.glass.fillSubtle} style={styles.track}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            onPress={() => select(o.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={styles.segment}
          >
            {active ? <View style={styles.activePill} /> : null}
            <Text
              style={[
                styles.label,
                { color: active ? theme.accents[accent].solid : theme.light.inkMuted, fontWeight: active ? '700' : '600' },
              ]}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </GlassSurface>
  );
}

const makeStyles = (theme: GlassTheme) => StyleSheet.create({
  track: { flexDirection: 'row', padding: 4 },
  segment: { flex: 1, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  activePill: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    margin: 0,
    borderRadius: glassRadius.pill,
    backgroundColor: theme.dark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.92)',
    borderWidth: theme.dark ? StyleSheet.hairlineWidth : 0,
    borderColor: 'rgba(255,255,255,0.25)',
    shadowColor: '#2A2340',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  label: { ...theme.glassType.label, fontSize: 14 },
});
