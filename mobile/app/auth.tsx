import { useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { makeRedirectUri } from 'expo-auth-session';
import { getQueryParams } from 'expo-auth-session/build/QueryParams';
import * as WebBrowser from 'expo-web-browser';
import { useFonts, Outfit_700Bold, Outfit_800ExtraBold } from '@expo-google-fonts/outfit';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { ensureUserData } from '@/lib/onboarding';
import { routeAfterLogin } from '@/lib/onboarding';
import { SITE_URL } from '@/lib/auth';

WebBrowser.maybeCompleteAuthSession();

const REDIRECT_URI = makeRedirectUri({ path: 'oauth2redirect' });

const LOGO = require('../assets/design/icon_logo.png');

const GREEN = '#6B8E61';
const INK = '#333333';

function GoogleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 48 48">
      <Path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <Path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <Path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <Path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </Svg>
  );
}

export default function AuthScreen() {
  const insets = useSafeAreaInsets();

  const [fontsLoaded] = useFonts({
    Outfit_700Bold,
    Outfit_800ExtraBold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string; password?: string }>({});

  const validate = () => {
    const errs: typeof fieldErrors = {};
    if (!fullName.trim()) errs.name = 'Full name is required';
    if (!email) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Invalid email address';
    if (!password) errs.password = 'Password is required';
    else if (password.length < 8) errs.password = 'Password must be at least 8 characters';
    else if (!/[A-Z]/.test(password)) errs.password = 'Password must contain an uppercase letter';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const signUp = async () => {
    setError('');
    if (!validate()) return;
    setLoading(true);
    const { data, error: err } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { full_name: fullName.trim() } },
    });
    setLoading(false);
    if (err) {
      const msg = err.message.toLowerCase();
      if (msg.includes('already') || msg.includes('exists') || msg.includes('registered')) {
        setError('An account with this email already exists.');
      } else {
        setError(err.message);
      }
      return;
    }
    if (data.session) {
      const { error: initError } = await ensureUserData(data.user!.id, email.trim().toLowerCase(), fullName.trim());
      if (initError) {
        setError(initError);
        return;
      }
      router.replace('/onboarding');
    } else {
      setSent(true);
    }
  };

  const signInWithGoogle = async () => {
    setGoogleLoading(true);
    setError('');
    const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: REDIRECT_URI,
        skipBrowserRedirect: true,
      },
    });
    if (oauthError || !data?.url) {
      setGoogleLoading(false);
      setError(oauthError?.message ?? 'Failed to start Google sign in.');
      return;
    }
    const result = await WebBrowser.openAuthSessionAsync(data.url, REDIRECT_URI);
    setGoogleLoading(false);
    if (result.type !== 'success') return;
    const { params, errorCode } = getQueryParams(result.url);
    if (params.access_token && params.refresh_token) {
      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: params.access_token,
        refresh_token: params.refresh_token,
      });
      if (sessionError) {
        setError(sessionError.message);
        return;
      }
      if (sessionData.user) {
        const dest = await routeAfterLogin(sessionData.user, '');
        router.replace(dest);
      }
    } else if (params.code) {
      const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(params.code);
      if (exchangeError) {
        setError(exchangeError.message);
        return;
      }
      if (sessionData.user) {
        const dest = await routeAfterLogin(sessionData.user, '');
        router.replace(dest);
      }
    } else {
      setError('Google sign in was interrupted. Please try again.');
    }
  };

  if (!fontsLoaded) return null;

  if (sent) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.sentHeading}>Check Your Email</Text>
        <Text style={styles.sentBody}>
          We&apos;ve sent a confirmation link to {email}. Confirm your email, then sign in to finish setting up your
          account.
        </Text>
        <Pressable style={styles.primaryBtn} onPress={() => router.replace('/login')}>
          <Text style={styles.primaryBtnText}>Back to Sign In</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.topSection, { paddingTop: insets.top + 16 }]}>
        <View style={styles.brand}>
          <View style={styles.logoWrap}>
            <ImageBackground source={LOGO} style={styles.logo} />
          </View>
          <View>
            <Text style={styles.brandName}>AETHER</Text>
            <Text style={styles.brandTag}>AI TUTOR</Text>
          </View>
        </View>

        <Text style={styles.heroHeading}>Welcome back! 👋</Text>
        <Text style={styles.heroSub}>
          Continue your learning journey with <Text style={styles.heroAccent}>Aether</Text>.
        </Text>
      </View>

      <View style={styles.spacer} />

      {/* Signup card */}
      <ScrollView
        style={[styles.card, { flexShrink: 1 }]}
        contentContainerStyle={{ paddingBottom: insets.bottom + 34 }}
        showsVerticalScrollIndicator={false}
      >
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Create your account</Text>
            <Text style={styles.cardSub}>Let&apos;s get you started!</Text>
          </View>

          <Pressable
            style={({ pressed }) => [styles.googleBtn, pressed && styles.pressed]}
            onPress={signInWithGoogle}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <ActivityIndicator color={INK} size="small" />
            ) : (
              <>
                <GoogleIcon />
                <Text style={styles.googleBtnText}>Sign up with Google</Text>
              </>
            )}
          </Pressable>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.fields}>
            <View style={styles.field}>
              <Text style={styles.label}>Full name</Text>
              <View style={styles.inputShell}>
                <Mail size={20} color="#BBBBBB" />
                <TextInput
                  style={styles.input}
                  placeholder="Full name"
                  placeholderTextColor="#CCCCCC"
                  autoCapitalize="words"
                  autoComplete="name"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
              {fieldErrors.name ? <Text style={styles.fieldError}>{fieldErrors.name}</Text> : null}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputShell}>
                <Mail size={20} color="#BBBBBB" />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#CCCCCC"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
              {fieldErrors.email ? <Text style={styles.fieldError}>{fieldErrors.email}</Text> : null}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputShell}>
                <Lock size={20} color="#BBBBBB" />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#CCCCCC"
                  secureTextEntry={!showPassword}
                  autoComplete="new-password"
                  value={password}
                  onChangeText={setPassword}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                  {showPassword ? <EyeOff size={20} color="#BBBBBB" /> : <Eye size={20} color="#BBBBBB" />}
                </Pressable>
              </View>
              {fieldErrors.password ? <Text style={styles.fieldError}>{fieldErrors.password}</Text> : null}
            </View>
          </View>

          <View style={styles.forgotRow}>
            <Text style={styles.forgotLink} onPress={() => router.replace('/login')}>
              Forgot password?
            </Text>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Pressable
            style={({ pressed }) => [styles.primaryBtn, loading && styles.btnDisabled, pressed && styles.pressed]}
            onPress={signUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={styles.primaryBtnText}>Create an account</Text>
                <View style={styles.primaryBtnCircle}>
                  <ArrowRight size={24} color={GREEN} strokeWidth={2.5} />
                </View>
              </>
            )}
          </Pressable>

          <Text style={styles.bottomNav}>
            Already have an account?{' '}
            <Text style={styles.bottomNavLink} onPress={() => router.replace('/login')}>
              Log in
            </Text>
          </Text>

          <View style={styles.homeIndicator} />
        </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topSection: {
    paddingHorizontal: 32,
    zIndex: 10,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 32 },
  logoWrap: { width: 40, height: 40 },
  logo: { width: '100%', height: '100%' },
  brandName: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 18,
    color: '#2D2D2D',
    letterSpacing: 2,
    lineHeight: 22,
  },
  brandTag: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 9,
    color: GREEN,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    lineHeight: 13,
  },
  heroHeading: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 36,
    lineHeight: 42,
    color: INK,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  heroSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 16,
    lineHeight: 24,
    color: '#666666',
    maxWidth: 260,
  },
  heroAccent: { fontFamily: 'PlusJakartaSans_600SemiBold', color: GREEN },
  spacer: { flex: 1, minHeight: 140 },
  card: {
    backgroundColor: '#FDFBF7',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: -20 },
    elevation: 10,
    paddingHorizontal: 32,
    paddingTop: 40,
  },
  cardHeader: { marginBottom: 32 },
  cardTitle: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 22,
    color: INK,
    marginBottom: 4,
  },
  cardSub: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, color: '#999999' },
  googleBtn: {
    height: 56,
    backgroundColor: '#fff',
    borderColor: '#EAEAEA',
    borderWidth: 1,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  googleBtnText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 15,
    color: INK,
  },
  pressed: { transform: [{ scale: 0.99 }] },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 16, marginVertical: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#EEEEEE' },
  dividerText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#BBBBBB',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  fields: { gap: 20 },
  field: { gap: 8 },
  label: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 13,
    color: '#666666',
    marginLeft: 4,
  },
  inputShell: {
    height: 56,
    backgroundColor: '#fff',
    borderColor: '#EAEAEA',
    borderWidth: 1,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 12,
  },
  input: {
    flex: 1,
    color: INK,
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_400Regular',
    paddingVertical: 0,
  },
  fieldError: {
    color: '#E06054',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginLeft: 4,
  },
  forgotRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8, marginBottom: 24 },
  forgotLink: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 14,
    color: GREEN,
  },
  errorBox: {
    backgroundColor: 'rgba(224,90,84,0.08)',
    borderColor: 'rgba(224,90,84,0.3)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  errorText: {
    color: '#E06054',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  primaryBtn: {
    backgroundColor: GREEN,
    height: 70,
    borderRadius: 35,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 32,
    paddingRight: 9,
    shadowColor: GREEN,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 16,
    color: '#fff',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  primaryBtnCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomNav: {
    textAlign: 'center',
    marginTop: 32,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 15,
    color: '#888888',
  },
  bottomNavLink: { fontFamily: 'PlusJakartaSans_700Bold', color: GREEN },
  homeIndicator: {
    width: 128,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignSelf: 'center',
    marginTop: 32,
  },
  centered: { flex: 1, justifyContent: 'center', paddingHorizontal: 32, zIndex: 10 },
  sentHeading: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 24,
    color: INK,
    textAlign: 'center',
    marginBottom: 8,
  },
  sentBody: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    lineHeight: 22,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
  },
});