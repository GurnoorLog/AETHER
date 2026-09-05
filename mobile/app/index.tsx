import { useEffect, useState } from 'react';
import {
  ImageBackground,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Outfit_700Bold, Outfit_800ExtraBold } from '@expo-google-fonts/outfit';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { ArrowRight } from 'lucide-react-native';
import { SERIF, EDITORIAL, EditorialPressable } from '@/components/editorial';

const BG = require('../assets/design/bg_launch.png');
const LOGO = require('../assets/design/icon_logo.png');

export default function Index() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const hidden = pathname === '/auth';

  const [fontsLoaded] = useFonts({
    Outfit_700Bold,
    Outfit_800ExtraBold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_700Bold,
  });

  const goNext = () => {
    router.push('/auth');
  };

  if (!fontsLoaded) return null;

  return (
    <ImageBackground source={BG} style={styles.root} imageStyle={styles.bgImage}>
          <StatusBar hidden />

      {!hidden && (
        <>
          {/* Brand header */}
          <View style={[styles.content, { marginTop: insets.top + 24 }]}>
            <View style={styles.brand}>
              <View style={styles.logoWrap}>
                <ImageBackground source={LOGO} style={styles.logo} />
              </View>
              <View>
                <Text style={styles.brandName}>AETHER</Text>
                <Text style={styles.brandTag}>AI TUTOR</Text>
              </View>
            </View>

            <Text style={styles.headline}>Your AI Learning{'\n'}Companion</Text>
          </View>

          {/* Bottom glass sheet */}
          <View style={[styles.footer, { paddingBottom: insets.bottom + 34 }]}>
            <EditorialPressable onPress={goNext} style={styles.cta} pressShadow="1px 1px 0 0 #2D3436">
              <Text style={styles.ctaText}>
                Let's start learning,{'\n'}my fella koala
              </Text>
              <View style={styles.ctaCircle}>
                <ArrowRight size={26} color={EDITORIAL.forest} strokeWidth={2.5} />
              </View>
            </EditorialPressable>
          </View>
        </>
      )}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  bgImage: {
    resizeMode: 'cover',
  },
  content: {
    paddingHorizontal: 32,
    paddingTop: 10,
    zIndex: 10,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 48,
  },
  logoWrap: {
    width: 48,
    height: 48,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  brandName: {
    fontFamily: SERIF,
    fontWeight: '700',
    fontSize: 20,
    color: EDITORIAL.ink,
    letterSpacing: 2,
    lineHeight: 24,
  },
  brandTag: {
    fontFamily: SERIF,
    fontWeight: '600',
    fontSize: 10,
    color: EDITORIAL.forest,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    lineHeight: 14,
  },
  headline: {
    fontFamily: SERIF,
    fontWeight: '700',
    fontSize: 42,
    lineHeight: 50,
    color: EDITORIAL.ink,
    letterSpacing: -1,
    maxWidth: 300,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(253, 251, 247, 0.96)',
    borderTopWidth: 2,
    borderTopColor: EDITORIAL.ink,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 0,
    paddingHorizontal: 32,
    paddingTop: 32,
    zIndex: 20,
  },
  cta: {
    backgroundColor: EDITORIAL.forest,
    borderColor: EDITORIAL.ink,
    borderWidth: 2,
    borderRadius: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 7,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 6,
    height: 76,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 28,
    paddingRight: 12,
    boxShadow: '4px 4px 0 0 #2D3436',
  },
  ctaPressed: {
    transform: [{ translateY: 3 }, { translateX: 3 }],
    opacity: 0.9,
  },
  ctaText: {
    fontFamily: SERIF,
    fontWeight: '600',
    fontSize: 17,
    lineHeight: 21,
    color: EDITORIAL.cream,
    maxWidth: 210,
  },
  ctaCircle: {
    width: 54,
    height: 54,
    borderRadius: 14,
    borderColor: EDITORIAL.ink,
    borderWidth: 1.5,
    backgroundColor: EDITORIAL.cream,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '2deg' }],
  },
});