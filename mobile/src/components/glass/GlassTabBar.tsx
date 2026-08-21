import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs/types';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { glassRadius, hitSlop, useTheme, type GlassTheme } from '@/theme';
import { GlassCluster } from './GlassCluster';
import { GlassSurface } from './GlassSurface';
import { Icon, type IconComponent } from './Icon';
import { Activity, ChartColumn, House, Map, MessageSquareText, Music, Trophy } from './icons';

/** Every nav target is this square, so the Home circle and the pill read as one size. */
const NAV_SIZE = 44;
/** Glass halo left around the dark selected disc, so it reads as sitting in the glass. */
const DISC_INSET = 3;

interface PillTabProps {
  icon: IconComponent;
  active: boolean;
  onPress: () => void;
  label: string;
}

function TabGlyph({ icon, active, size = 21 }: { icon: IconComponent; active: boolean; size?: number }) {
  const { theme, accent } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const progress = useRef(new Animated.Value(active ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(progress, {
      toValue: active ? 1 : 0,
      damping: 18,
      stiffness: 240,
      mass: 0.7,
      useNativeDriver: true,
    }).start();
  }, [active, progress]);
  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1] });
  return (
    <>
      <Animated.View
        pointerEvents="none"
        style={[styles.disc, { opacity: progress, transform: [{ scale }] }]}
      >
        <LinearGradient
          colors={[...theme.accents[accent].gradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <Animated.View style={[styles.glyph, { transform: [{ scale }] }]}>
        <Icon
          icon={icon}
          size={size}
          color={active ? (theme.dark ? '#181425' : theme.light.ink) : (theme.dark ? '#221C34' : theme.light.inkMuted)}
          strokeWidth={active ? 2 : 1.75}
        />
      </Animated.View>
    </>
  );
}

/** A tap target inside the shared pill; a solid dark disc + white glyph when selected. */
function PillTab({ icon, active, onPress, label }: PillTabProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <Pressable
      onPress={onPress}
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [styles.tab, { opacity: pressed ? 0.7 : 1 }]}
    >
      <TabGlyph icon={icon} active={active} />
    </Pressable>
  );
}

/**
 * The floating liquid-glass nav: a Home anchor and, a hair to its right, one
 * continuous frosted pill holding the other live destinations (Home, Tutor,
 * Quizzes, Music) as tap targets. Home stays a glass body at ALL times so its
 * fluid merge into the pill (iOS 26) is always present; selection — on any tab —
 * is a solid dark disc drawn on top, so the selected target always reads the
 * same. It re-presents the Expo Router tab list, so every route stays reachable.
 */
export function GlassTabBar({ state, navigation }: BottomTabBarProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const activeName = state.routes[state.index]?.name;
  // Liquid Glass often fails to initialise on the first paint (especially under a
  // tab navigator). Remount once after layout so the light material actually sticks.
  const [glassEpoch, setGlassEpoch] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setGlassEpoch((n) => n + 1));
    return () => cancelAnimationFrame(id);
  }, []);

  const goTo = (name: string) => {
    const route = state.routes.find((r) => r.name === name);
    if (!route) return;
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (activeName !== name && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  const homeActive = activeName === 'index';

  return (
    <View style={[styles.wrap, { paddingBottom: insets.bottom + 10 }]} pointerEvents="box-none">
      <GlassCluster key={glassEpoch} spacing={22} style={styles.group}>
        {/* Home is always glass (so it always merges into the pill); the dark disc is an overlay.
            Never put opacity < 1 on this Pressable — it parents a GlassView and breaks the effect. */}
        <Pressable
          onPress={() => goTo('index')}
          accessibilityRole="button"
          accessibilityLabel="Hub"
          accessibilityState={{ selected: homeActive }}
          style={styles.homeShadow}
        >
          <GlassSurface radius={NAV_SIZE / 2} intensity="regular" fill={theme.dark ? theme.glass.fillStrong : theme.glass.fill} style={styles.home}>
            <TabGlyph icon={House} active={homeActive} size={22} />
          </GlassSurface>
        </Pressable>

        {/* One continuous glass pill; the icons are tap targets within it, not separate circles. */}
        <View style={[styles.pillShadow, theme.glow.floating]}>
          <GlassSurface radius={glassRadius.pill} intensity="regular" fill={theme.dark ? theme.glass.fillStrong : theme.glass.fill} style={styles.pill}>
            <PillTab icon={ChartColumn} active={activeName === 'home'} onPress={() => goTo('home')} label="Home" />
            <PillTab icon={Map} active={activeName === 'roadmap'} onPress={() => goTo('roadmap')} label="Roadmap" />
            <PillTab icon={MessageSquareText} active={activeName === 'tutor'} onPress={() => goTo('tutor')} label="Tutor" />
            <PillTab icon={Activity} active={activeName === 'progress'} onPress={() => goTo('progress')} label="Progress" />
            <PillTab icon={Trophy} active={activeName === 'quizzes'} onPress={() => goTo('quizzes')} label="Quizzes" />
            <PillTab icon={Music} active={activeName === 'music'} onPress={() => goTo('music')} label="Music" />
          </GlassSurface>
        </View>
      </GlassCluster>
    </View>
  );
}

const makeStyles = (theme: GlassTheme) => StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },
  group: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  homeShadow: { borderRadius: NAV_SIZE / 2, ...theme.glow.floating },
  home: { width: NAV_SIZE, height: NAV_SIZE, alignItems: 'center', justifyContent: 'center' },

  pillShadow: { borderRadius: glassRadius.pill },
  pill: { height: NAV_SIZE, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 },
  tab: { width: NAV_SIZE, height: NAV_SIZE, alignItems: 'center', justifyContent: 'center' },
  glyph: { zIndex: 1 },

  // The single, consistent selected indicator across every tab: the signature
  // yellow→lavender gradient disc with a thin bright hairline, drawn on top of
  // the glass so the merge stays intact.
  disc: {
    position: 'absolute',
    top: DISC_INSET,
    bottom: DISC_INSET,
    left: DISC_INSET,
    right: DISC_INSET,
    borderRadius: glassRadius.pill,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
});
