import Constants, { ExecutionEnvironment } from 'expo-constants';
import type { ComponentType } from 'react';
import { Platform, type ViewProps } from 'react-native';

type GlassStyle = 'clear' | 'regular' | 'none';

export interface NativeGlassViewProps extends ViewProps {
  glassEffectStyle?: GlassStyle;
  tintColor?: string;
  isInteractive?: boolean;
  colorScheme?: 'auto' | 'light' | 'dark';
}

export interface NativeGlassContainerProps extends ViewProps {
  spacing?: number;
}

interface GlassModule {
  GlassView: ComponentType<NativeGlassViewProps>;
  GlassContainer: ComponentType<NativeGlassContainerProps>;
  isLiquidGlassAvailable: () => boolean;
}

let cached: GlassModule | null | undefined;

function loadGlass(): GlassModule | null {
  if (cached !== undefined) return cached;

  const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
  if (isExpoGo || Platform.OS !== 'ios') {
    cached = null;
    return cached;
  }

  try {
    cached = require('expo-glass-effect') as GlassModule;
  } catch {
    cached = null;
  }
  return cached;
}

export function nativeGlassAvailable(): boolean {
  const mod = loadGlass();
  if (!mod) return false;
  try {
    return mod.isLiquidGlassAvailable();
  } catch {
    return false;
  }
}

export function getNativeGlass(): Pick<GlassModule, 'GlassView' | 'GlassContainer'> | null {
  const mod = loadGlass();
  if (!mod) return null;
  return { GlassView: mod.GlassView, GlassContainer: mod.GlassContainer };
}
