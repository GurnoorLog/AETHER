import { StatusBar } from 'expo-status-bar';
import { memo, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets, type Edge } from 'react-native-safe-area-context';

import { spacing } from '@/theme';
import { ScrollEdgeFades } from './ScrollEdgeFades';

const MemoScrollEdgeFades = memo(ScrollEdgeFades);

interface GlassScreenProps {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  edges?: Edge[];
  contentStyle?: ViewStyle;
  accent?: string;
  transitionOnFocus?: boolean;
  scrollUnderTop?: boolean;
}

export function GlassScreen({
  children,
  scroll = false,
  padded = true,
  edges = ['top', 'left', 'right'],
  contentStyle,
  transitionOnFocus = false,
  scrollUnderTop = false,
}: GlassScreenProps) {
  const insets = useSafeAreaInsets();
  const sceneVeil = useRef(new Animated.Value(transitionOnFocus ? 1 : 0)).current;
  const [fades, setFades] = useState({ top: false, bottom: false });
  const [viewportHeight, setViewportHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const inner = [padded && styles.padded, scroll && scrollUnderTop && { paddingTop: insets.top + spacing.sm }, contentStyle];
  const safeEdges = scrollUnderTop ? edges.filter((edge) => edge !== 'top') : edges;
  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = Math.max(0, event.nativeEvent.contentOffset.y);
      const top = y > 4;
      const bottom = contentHeight > viewportHeight && y + viewportHeight < contentHeight - 4;
      setFades((prev) => (prev.top === top && prev.bottom === bottom ? prev : { top, bottom }));
    },
    [contentHeight, viewportHeight],
  );
  const showTopFade = scroll && fades.top;
  const showBottomFade = scroll && fades.bottom;
  useEffect(() => {
    if (!transitionOnFocus) return;
    if (sceneVeil) {
      Animated.timing(sceneVeil, { toValue: 0, duration: 220, useNativeDriver: true }).start();
    }
  }, [sceneVeil, transitionOnFocus]);
  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safe} edges={safeEdges}>
        {scroll ? (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[styles.scrollContent, styles.wideColumn, inner]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            onLayout={(event) => setViewportHeight(event.nativeEvent.layout.height)}
            onContentSizeChange={(_width, height) => setContentHeight(height)}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.flex, inner]}>{children}</View>
        )}
        {scroll ? (
          <MemoScrollEdgeFades top={showTopFade} bottom={showBottomFade} topInset={scrollUnderTop ? insets.top : 0} />
        ) : null}
        {transitionOnFocus ? (
          <Animated.View pointerEvents="none" style={[styles.sceneVeil, { opacity: sceneVeil, backgroundColor: '#FDFBF7' }]} />
        ) : null}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FDFBF7' },
  safe: { flex: 1 },
  flex: { flex: 1 },
  padded: { paddingHorizontal: spacing.lg },
  scrollContent: { paddingBottom: spacing.huge, paddingTop: spacing.sm },
  wideColumn: { width: '100%', maxWidth: 720, alignSelf: 'center' },
  sceneVeil: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
});
