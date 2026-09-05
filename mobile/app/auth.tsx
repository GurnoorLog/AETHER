import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { makeRedirectUri } from 'expo-auth-session';
import { getQueryParams } from 'expo-auth-session/build/QueryParams';
import * as WebBrowser from 'expo-web-browser';
import { Mail, Lock, UserRound, Check, KeyRound } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { SERIF, EDITORIAL, Stamp } from '@/components/editorial';
import { routeAfterLogin } from '@/lib/onboarding';

WebBrowser.maybeCompleteAuthSession();

const REDIRECT_URI = makeRedirectUri({ path: 'oauth2redirect' });

type Mode = 'signup' | 'signin';

export default function AuthModal() {
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState<Mode>('signup');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [activationError, setActivationError] = useState<{ email: string; message: string } | null>(null);

  const accent = EDITORIAL.forest;

  useEffect(() => {
    let active = true;
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session && active) {
        const dest = await routeAfterLogin(session.user, email);
        router.replace(dest);
      }
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const handleSignUp = async () => {
    setFormError(null);
    setActivationError(null);
    if (!fullName.trim()) {
      setFormError('Please enter your name.');
      return;
    }
    if (!email.trim() || !password) {
      setFormError('Email and password are required.');
      return;
    }
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setFormError('Passwords do not match.');
      return;
    }
    if (!accepted) {
      setFormError('Please accept the Terms and Privacy Policy.');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: fullName.trim() } },
      });
      if (error) {
        let message = error.message;
        if (error.message?.toLowerCase().includes('email not confirmed')) {
          message = 'Please check your email to activate your account.';
          setActivationError({ email: email.trim(), message });
        }
        setFormError(message);
        setLoading(false);
        return;
      }
      if (data.session) {
        const dest = await routeAfterLogin(data.session.user, email.trim());
        router.replace(dest);
      } else {
        setActivationError({
          email: email.trim(),
          message: 'Account created! Check your email to activate your account, then log in.',
        });
      }
      setLoading(false);
    } catch (e: any) {
      setFormError(e?.message ?? 'Something went wrong.');
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    setFormError(null);
    setActivationError(null);
    if (!email.trim() || !password) {
      setFormError('Enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        let message = error.message;
        if (error.message?.toLowerCase().includes('email not confirmed')) {
          message = 'Please check your email to activate your account first.';
          setActivationError({ email: email.trim(), message });
        }
        setFormError(message);
        setLoading(false);
        return;
      }
      if (data.session) {
        const dest = await routeAfterLogin(data.session.user, email.trim());
        router.replace(dest);
      }
      setLoading(false);
    } catch (e: any) {
      setFormError(e?.message ?? 'Something went wrong.');
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setFormError(null);
    setActivationError(null);
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: REDIRECT_URI,
          skipBrowserRedirect: true,
        },
      });
      if (error || !data?.url) {
        setLoading(false);
        setFormError(error?.message ?? 'Failed to start Google sign in.');
        return;
      }
      const result = await WebBrowser.openAuthSessionAsync(data.url, REDIRECT_URI);
      if (result.type !== 'success') {
        setLoading(false);
        return;
      }
      const { params, errorCode } = getQueryParams(result.url);
      if (errorCode) {
        setLoading(false);
        setFormError('Google sign in was interrupted. Please try again.');
        return;
      }
      if (params.access_token && params.refresh_token) {
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token,
        });
        if (sessionError) {
          setLoading(false);
          setFormError(sessionError.message);
          return;
        }
        if (sessionData.user) {
          const dest = await routeAfterLogin(sessionData.user, email);
          router.replace(dest);
          return;
        }
      } else if (params.code) {
        const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(params.code);
        if (exchangeError) {
          setLoading(false);
          setFormError(exchangeError.message);
          return;
        }
        if (sessionData.user) {
          const dest = await routeAfterLogin(sessionData.user, email);
          router.replace(dest);
          return;
        }
      }
      setLoading(false);
      setFormError('Google sign in was interrupted. Please try again.');
    } catch (e: any) {
      setLoading(false);
      setFormError(e?.message ?? 'Google sign-in failed.');
    }
  };

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['#F6F1E6', '#FDFBF7', '#EFE9DA']}
        style={StyleSheet.absoluteFill}
      />
      <Image
        source={require('../assets/design/sakura_leaves.png')}
        style={styles.sakura}
        resizeMode="cover"
      />
      <StatusBar hidden />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 48 }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoWrap}>
            <Image
              source={require('../assets/design/icon_logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.appName}>Aether</Text>
          </View>

          <View style={styles.card}>
            <Stamp tone="forest" rotate={-1.5} style={styles.stamp}>{mode === 'signup' ? 'New member' : 'Welcome back'}</Stamp>
            <Text style={styles.title}>
              {mode === 'signup' ? 'Create your account' : 'Log in'}
            </Text>
            <Text style={styles.subtitle}>
              {mode === 'signup'
                ? 'Start learning with your AI tutor.'
                : 'Log in to pick up where you left off.'}
            </Text>

            {activationError ? (
              <View style={styles.activationBanner}>
                <Mail size={18} color={EDITORIAL.forest} strokeWidth={1.8} />
                <Text style={styles.activationText}>{activationError.message}</Text>
              </View>
            ) : null}

            {mode === 'signup' ? (
              <View style={styles.inputWrap}>
                <UserRound size={20} color={EDITORIAL.forest} strokeWidth={1.8} />
                <TextInput
                  style={styles.input}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Full name"
                  placeholderTextColor="#9C95A3"
                  autoCapitalize="words"
                  editable={!loading}
                />
              </View>
            ) : null}

            <View style={styles.inputWrap}>
              <Mail size={20} color={EDITORIAL.forest} strokeWidth={1.8} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                placeholderTextColor="#9C95A3"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            <View style={styles.inputWrap}>
              <Lock size={20} color={EDITORIAL.forest} strokeWidth={1.8} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor="#9C95A3"
                secureTextEntry
                editable={!loading}
              />
            </View>

            {mode === 'signup' ? (
              <View style={styles.inputWrap}>
                <KeyRound size={20} color={EDITORIAL.forest} strokeWidth={1.8} />
                <TextInput
                  style={styles.input}
                  value={confirm}
                  onChangeText={setConfirm}
                  placeholder="Confirm password"
                  placeholderTextColor="#9C95A3"
                  secureTextEntry
                  editable={!loading}
                />
              </View>
            ) : null}

            {mode === 'signup' ? (
              <Pressable
                style={styles.termsRow}
                onPress={() => !loading && setAccepted((v) => !v)}
              >
                <View style={[styles.checkbox, accepted && styles.checkboxOn]}>
                  {accepted ? (
                    <Check size={14} color="#fff" strokeWidth={3} />
                  ) : null}
                </View>
                <Text style={styles.termsText}>
                  I agree to the{' '}
                  <Text style={[styles.link, { color: accent }]}>Terms</Text> and{' '}
                  <Text style={[styles.link, { color: accent }]}>Privacy Policy</Text>
                </Text>
              </Pressable>
            ) : null}

            {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

            <Pressable
              style={[styles.button, { backgroundColor: EDITORIAL.forest }, loading && styles.buttonDisabled]}
              disabled={loading}
              onPress={mode === 'signup' ? handleSignUp : handleSignIn}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  {mode === 'signup' ? 'Create account' : 'Log in'}
                </Text>
              )}
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.divider} />
            </View>

            <Pressable
              style={[styles.googleButton, loading && styles.buttonDisabled]}
              disabled={loading}
              onPress={handleGoogle}
            >
              {loading ? (
                <ActivityIndicator color="#241F2E" />
              ) : (
                <>
                  <Text style={styles.googleG}>G</Text>
                  <Text style={styles.googleText}>
                    {mode === 'signup' ? 'Continue with Google' : 'Log in with Google'}
                  </Text>
                </>
              )}
            </Pressable>

            <Pressable
              style={styles.modeToggleRow}
              onPress={() => {
                setFormError(null);
                setActivationError(null);
                setMode((m) => (m === 'signup' ? 'signin' : 'signup'));
              }}
            >
              <Text style={styles.modeToggleText}>
                {mode === 'signup' ? 'Already have an account? ' : 'New to Aether? '}
                <Text style={[styles.modeToggleLink, { color: accent }]}>
                  {mode === 'signup' ? 'Log in' : 'Create one'}
                </Text>
              </Text>
            </Pressable>
          </View>

          <View style={{ height: insets.bottom + 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: '#FDFBF7' },
  sakura: {
    position: 'absolute',
    top: -40,
    right: -60,
    width: 280,
    height: 280,
    opacity: 0.5,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 24,
  },
  appName: {
    marginTop: 10,
    fontFamily: SERIF,
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: 0.3,
    color: EDITORIAL.ink,
  },
  stamp: { marginBottom: 14 },
  card: {
    width: '100%',
    backgroundColor: EDITORIAL.cream,
    borderWidth: 2,
    borderColor: EDITORIAL.ink,
    borderRadius: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 7,
    padding: 22,
    boxShadow: '4px 4px 0 0 #2D3436',
  },
  title: {
    fontFamily: SERIF,
    fontSize: 22,
    fontWeight: '700',
    color: EDITORIAL.ink,
  },
  subtitle: {
    fontFamily: SERIF,
    fontSize: 14,
    marginTop: 4,
    marginBottom: 18,
    color: EDITORIAL.inkMuted,
  },
  activationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E9F2E4',
    borderColor: '#C9DEC2',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
  },
  activationText: {
    flex: 1,
    color: EDITORIAL.forest,
    fontFamily: SERIF,
    fontSize: 13,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: EDITORIAL.cream,
    borderWidth: 2,
    borderColor: EDITORIAL.ink,
    borderRadius: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    gap: 10,
  },
  input: {
    flex: 1,
    fontFamily: SERIF,
    fontSize: 15,
    color: EDITORIAL.ink,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: EDITORIAL.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: {
    backgroundColor: EDITORIAL.forest,
    borderColor: EDITORIAL.ink,
  },
  termsText: {
    flex: 1,
    fontFamily: SERIF,
    fontSize: 13,
    color: EDITORIAL.inkMuted,
  },
  link: {
    fontWeight: '600',
  },
  errorText: {
    color: '#A9533A',
    fontFamily: SERIF,
    fontSize: 13,
    marginBottom: 10,
  },
  button: {
    borderWidth: 2,
    borderColor: EDITORIAL.ink,
    borderRadius: 255,
    borderTopLeftRadius: 255,
    borderTopRightRadius: 15,
    borderBottomLeftRadius: 225,
    borderBottomRightRadius: 15,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
    boxShadow: '3px 3px 0 0 #2D3436',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: EDITORIAL.cream,
    fontFamily: SERIF,
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    gap: 12,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#DCD5C6',
  },
  dividerText: {
    fontFamily: SERIF,
    fontSize: 13,
    color: EDITORIAL.inkMuted,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 6,
    paddingVertical: 13,
    borderWidth: 2,
    borderColor: EDITORIAL.ink,
    backgroundColor: EDITORIAL.cream,
  },
  googleText: {
    fontFamily: SERIF,
    fontSize: 15,
    fontWeight: '600',
    color: EDITORIAL.ink,
  },
  googleG: {
    fontFamily: SERIF,
    fontSize: 18,
    fontWeight: '700',
    color: '#EA4335',
  },
  modeToggleRow: {
    marginTop: 18,
    alignItems: 'center',
  },
  modeToggleText: {
    fontFamily: SERIF,
    fontSize: 14,
    color: EDITORIAL.inkMuted,
  },
  modeToggleLink: {
    fontWeight: '700',
  },
});
