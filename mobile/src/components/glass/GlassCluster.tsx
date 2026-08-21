import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { getNativeGlass } from './liquidGlassNative';

interface GlassClusterProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Distance at which adjacent glass shapes begin to merge (native only). */
  spacing?: number;
}

/**
 * Wraps a row/column of `GlassSurface`s so that, on iOS 26+, adjacent glass
 * shapes blend into one liquid blob (the merged bottom-nav cluster). Off the
 * native path it's a plain layout View — the children still render as separate
 * frosted shapes, just without the fluid merge.
 */
export function GlassCluster({ children, style, spacing }: GlassClusterProps) {
  const native = getNativeGlass();
  if (native) {
    const { GlassContainer } = native;
    return (
      <GlassContainer spacing={spacing} style={style}>
        {children}
      </GlassContainer>
    );
  }
  return <View style={style}>{children}</View>;
}
