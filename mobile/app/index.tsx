import { useEffect, useState } from 'react';
import {
  ImageBackground,
  Pressable,
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

const BG = require('../assets/design/bg.jpg');
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
            <Pressable onPress={goNext} style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}>
              <Text style={styles.ctaText}>
                Let's start learning,{'\n'}my fella koala
              </Text>
              <View style={styles.ctaCircle}>
                <ArrowRight size={26} color="#6B8E61" strokeWidth={2.5} />
              </View>
            </Pressable>
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
    fontFamily: 'Outfit_700Bold',
    fontSize: 20,
    color: '#2D2D2D',
    letterSpacing: 2,
    lineHeight: 24,
  },
  brandTag: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 10,
    color: '#6B8E61',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    lineHeight: 14,
  },
  headline: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 42,
    lineHeight: 48,
    color: '#333333',
    letterSpacing: -1,
    maxWidth: 280,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(251, 246, 237, 0.95)',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 32,
    paddingTop: 32,
    zIndex: 20,
  },
  cta: {
    backgroundColor: '#6B8E61',
    height: 76,
    borderRadius: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 32,
    paddingRight: 12,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  ctaPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  ctaText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 17,
    lineHeight: 21,
    color: '#fff',
    maxWidth: 200,
  },
  ctaCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});