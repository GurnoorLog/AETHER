/**
 * The ONLY module that touches `expo-glass-effect`.
 *
 * `expo-glass-effect`'s iOS entry calls `requireNativeViewManager('ExpoGlassEffect', …)`
 * at *module scope* — so merely importing the package throws in any runtime where the
 * native module isn't installed (Expo Go, Android, web). We therefore never import it
 * statically: `loadGlass()` gates on execution environment + platform and pulls it in
 * with a guarded `require`, mirroring how the vision backends isolate the camera stack.
 *
 * In Expo Go the `require` is never reached, so the throwing module is never evaluated
 * and the audio-only path stays clean. Everything here returns null/false on failure so
 * callers can fall back to the `expo-blur` presentation.
 */
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

// `undefined` = not yet probed, `null` = probed and unavailable.
let cached: GlassModule | null | undefined;

function loadGlass(): GlassModule | null {
  if (cached !== undefined) return cached;

  const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
  if (isExpoGo || Platform.OS !== 'ios') {
    cached = null;
    return cached;
  }

  try {
    // Reached only inside a native iOS build. Guarded because the native view
    // managers resolve (and can throw) the moment this module is evaluated.
    cached = require('expo-glass-effect') as GlassModule;
  } catch {
    cached = null;
  }
  return cached;
}

/** True only when running on iOS 26+ with the Liquid Glass system available. */
export function nativeGlassAvailable(): boolean {
  const mod = loadGlass();
  if (!mod) return false;
  try {
    return mod.isLiquidGlassAvailable();
  } catch {
    return false;
  }
}

/** The native glass components, or null when the blur fallback should be used. */
export function getNativeGlass(): Pick<GlassModule, 'GlassView' | 'GlassContainer'> | null {
  const mod = loadGlass();
  if (!mod) return null;
  return { GlassView: mod.GlassView, GlassContainer: mod.GlassContainer };
}
