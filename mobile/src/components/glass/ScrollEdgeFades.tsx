import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

interface ScrollEdgeFadesProps {
  top: boolean;
  bottom: boolean;
  topInset?: number;
}

export function ScrollEdgeFades({ top, bottom, topInset = 0 }: ScrollEdgeFadesProps) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {top ? (
        <LinearGradient
          colors={['#FDFBF7', '#FDFBF7d9', '#FDFBF700']}
          locations={[0, 0.5, 1]}
          style={[styles.top, { height: topInset + 48 }]}
        />
      ) : null}
      {bottom ? (
        <LinearGradient colors={['#FDFBF700', '#FDFBF7e8']} style={styles.bottom} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  top: { position: 'absolute', top: 0, left: 0, right: 0 },
  bottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 40 },
});
