import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { getNativeGlass } from './liquidGlassNative';

interface GlassClusterProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  spacing?: number;
}

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
