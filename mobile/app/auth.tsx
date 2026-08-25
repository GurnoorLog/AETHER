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
import { Mail, Lock, UserRound, Check, KeyRound } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/theme';
import { routeAfterLogin } from '@/lib/onboarding';

type Mode = 'signup' | 'signin';

const ACCENT = 'feedback';

export default function AuthModal() {
  const { theme } = useTheme();
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

  const accent = theme.accents[ACCENT].solid;

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
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: 'aether://auth/callback' },
      });
      if (error) setFormError(error.message);
    } catch (e: any) {
      setFormError(e?.message ?? 'Google sign-in failed.');
    }
  };

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['#FFEAF2', '#FDFBF7', '#F3ECFB']}
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
            <Text style={styles.title}>
              {mode === 'signup' ? 'Create your account' : 'Welcome back'}
            </Text>
            <Text style={styles.subtitle}>
              {mode === 'signup'
                ? 'Start learning with your AI tutor.'
                : 'Log in to pick up where you left off.'}
            </Text>

            {activationError ? (
              <View style={styles.activationBanner}>
                <Mail size={18} color="#0B7A4B" strokeWidth={1.8} />
                <Text style={styles.activationText}>{activationError.message}</Text>
              </View>
            ) : null}

            {mode === 'signup' ? (
              <View style={styles.inputWrap}>
                <UserRound size={20} color="#6E6577" strokeWidth={1.8} />
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
              <Mail size={20} color="#6E6577" strokeWidth={1.8} />
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
              <Lock size={20} color="#6E6577" strokeWidth={1.8} />
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
                <KeyRound size={20} color="#6E6577" strokeWidth={1.8} />
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
              style={[styles.button, { backgroundColor: accent }, loading && styles.buttonDisabled]}
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
              <Text style={styles.googleG}>G</Text>
              <Text style={styles.googleText}>
                {mode === 'signup' ? 'Continue with Google' : 'Log in with Google'}
              </Text>
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
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: 0.3,
    color: '#241F2E',
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#241F2E',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 18,
    color: '#6E6577',
  },
  activationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E7F7EF',
    borderColor: '#BFE9D4',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  activationText: {
    flex: 1,
    color: '#0B7A4B',
    fontSize: 13,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F1F8',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#241F2E',
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
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#C9B8A8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: {
    backgroundColor: '#DB5F9E',
    borderColor: '#DB5F9E',
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: '#6E6577',
  },
  link: {
    fontWeight: '600',
  },
  errorText: {
    color: '#D23B5B',
    fontSize: 13,
    marginBottom: 10,
  },
  button: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
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
    backgroundColor: '#E9E3EF',
  },
  dividerText: {
    fontSize: 13,
    color: '#6E6577',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 14,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: '#E9E3EF',
    backgroundColor: '#F5F1F8',
  },
  googleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#241F2E',
  },
  googleG: {
    fontSize: 18,
    fontWeight: '700',
    color: '#EA4335',
  },
  modeToggleRow: {
    marginTop: 18,
    alignItems: 'center',
  },
  modeToggleText: {
    fontSize: 14,
    color: '#6E6577',
  },
  modeToggleLink: {
    fontWeight: '700',
  },
});
