import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

interface ScrollEdgeFadesProps {
  top: boolean;
  bottom: boolean;
  topInset?: number;
}

/** Indicates clipped scroll content without intercepting gestures or controls. */
export function ScrollEdgeFades({ top, bottom, topInset = 0 }: ScrollEdgeFadesProps) {
  const { theme } = useTheme();
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {top ? (
        <LinearGradient
          colors={[`${theme.light.base}e5`, `${theme.light.base}d9`, `${theme.light.base}00`]}
          locations={[0, 0.5, 1]}
          style={[styles.top, { height: topInset + 48 }]}
        />
      ) : null}
      {bottom ? (
        <LinearGradient colors={[`${theme.light.mist}00`, `${theme.light.mist}e8`]} style={styles.bottom} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  top: { position: 'absolute', top: 0, left: 0, right: 0 },
  bottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 40 },
});
