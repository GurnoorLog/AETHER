import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { router } from 'expo-router';
import { makeRedirectUri } from 'expo-auth-session';
import { getQueryParams } from 'expo-auth-session/build/QueryParams';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/lib/supabase';
import { routeAfterLogin } from '@/lib/onboarding';
import { SITE_URL } from '@/lib/auth';

import { useTheme, glassRadius, spacing, type GlassTheme } from '@/theme';
import { GlassScreen } from '@/components/glass/GlassScreen';
import { GlassSurface } from '@/components/glass/GlassSurface';
import { Icon } from '@/components/glass/Icon';
import { Eye, EyeOff, GraduationCap } from '@/components/glass/icons';

WebBrowser.maybeCompleteAuthSession();

const REDIRECT_URI = makeRedirectUri({ path: 'oauth2redirect' });
console.log('[auth] REDIRECT_URI =', REDIRECT_URI);

const ACCENT = 'home';

function Label({ text }: { text: string }) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return <Text style={styles.label}>{text}</Text>;
}

export default function LoginScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const solid = theme.accents[ACCENT].solid;

  const [view, setView] = useState<'login' | 'forgot'>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Forgot-password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');

  const validate = () => {
    let valid = true;
    setEmailError('');
    setPasswordError('');

    if (!email) {
      setEmailError('Email is required');
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Invalid email address');
      valid = false;
    }

    if (!password) {
      setPasswordError('Password is required');
      valid = false;
    }

    return valid;
  };

  const signIn = async () => {
    setError('');
    if (!validate()) return;
    setLoading(true);
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    if (data.user) {
      const dest = await routeAfterLogin(data.user, email);
      router.replace(dest);
    } else {
      setError('Failed to sign in.');
    }
  };

  const openWebAuth = () => router.push('/auth');

  const signInWithGoogle = async () => {
    setLoading(true);
    setError('');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: REDIRECT_URI,
        skipBrowserRedirect: true,
      },
    });
    if (error || !data?.url) {
      setLoading(false);
      setError(error?.message ?? 'Failed to start Google sign in.');
      return;
    }
    console.log('[auth] oauth url', data.url);
    const result = await WebBrowser.openAuthSessionAsync(data.url, REDIRECT_URI);
    setLoading(false);
    console.log('[auth] session result', JSON.stringify(result));
    if (result.type !== 'success') {
      console.log('[auth] not success, type =', result.type);
      return;
    }
    console.log('[auth] redirect url', result.url);
    const { params, errorCode } = getQueryParams(result.url);
    console.log('[auth] parsed params', JSON.stringify(params), 'errorCode', errorCode);
    if (params.access_token && params.refresh_token) {
      const { data, error: sessionError } = await supabase.auth.setSession({
        access_token: params.access_token,
        refresh_token: params.refresh_token,
      });
      if (sessionError) {
        setError(sessionError.message);
        return;
      }
      if (data.user) {
        const dest = await routeAfterLogin(data.user, '');
        router.replace(dest);
      }
    } else if (params.code) {
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(params.code);
      if (exchangeError) {
        setError(exchangeError.message);
        return;
      }
      if (data.user) {
        const dest = await routeAfterLogin(data.user, '');
        router.replace(dest);
      }
    } else {
      setError('Google sign in was interrupted. Please try again.');
    }
  };

  const sendResetLink = async () => {
    setForgotError('');
    setForgotSent(false);
    if (!forgotEmail) {
      setForgotError('Email is required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) {
      setForgotError('Invalid email address');
      return;
    }
    setForgotLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${SITE_URL}/auth/callback?type=recovery`,
    });
    setForgotLoading(false);
    if (error) {
      setForgotError(error.message);
      return;
    }
    setForgotSent(true);
  };

  const openForgot = () => {
    setForgotError('');
    setForgotSent(false);
    setForgotEmail(email);
    setView('forgot');
  };

  const backToLogin = () => setView('login');

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <GlassScreen scroll accent={ACCENT} contentStyle={styles.screen}>
        {/* Brand mark */}
        <View style={styles.brand}>
          <GlassSurface radius={glassRadius.pill} intensity="thick" fill={theme.glass.fillStrong} tintColor={theme.accents[ACCENT].wash} style={styles.logo}>
            <Icon icon={GraduationCap} size={26} color={solid} strokeWidth={1.9} />
          </GlassSurface>
          <Text style={styles.brandName}>AETHER</Text>
          <Text style={styles.brandTagline}>Your personal AI tutor that never forgets.</Text>
        </View>

        <View style={styles.body}>
          {view === 'login' ? (
            <>
              <View style={styles.header}>
                <Text style={styles.eyebrow}>Welcome Back</Text>
                <Text style={styles.heading}>Sign in to continue your learning journey</Text>
              </View>

              <View style={styles.field}>
                <Label text="Email" />
                <GlassSurface radius={glassRadius.lozenge} intensity="regular" fill={theme.glass.fill} style={styles.inputShell}>
                  <TextInput
                    style={styles.input}
                    placeholder="you@example.com"
                    placeholderTextColor={theme.light.inkFaint}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                    value={email}
                    onChangeText={setEmail}
                  />
                </GlassSurface>
                {emailError ? <Text style={styles.fieldError}>{emailError}</Text> : null}
              </View>

              <View style={styles.field}>
                <Label text="Password" />
                <GlassSurface radius={glassRadius.lozenge} intensity="regular" fill={theme.glass.fill} style={styles.inputShell}>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    placeholderTextColor={theme.light.inkFaint}
                    secureTextEntry={!showPassword}
                    autoComplete="current-password"
                    value={password}
                    onChangeText={setPassword}
                  />
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={8}
                    style={styles.eyeToggle}
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <Icon icon={showPassword ? EyeOff : Eye} size={20} color={theme.light.inkSoft} strokeWidth={1.8} />
                  </Pressable>
                </GlassSurface>
                {passwordError ? <Text style={styles.fieldError}>{passwordError}</Text> : null}
                <View style={styles.forgotRow}>
                  <Pressable onPress={openForgot} hitSlop={8} accessibilityRole="button">
                    <Text style={styles.forgot}>Forgot Password?</Text>
                  </Pressable>
                </View>
              </View>

              <Pressable style={styles.rememberRow} onPress={() => setRemember(!remember)}>
                <View style={[styles.checkbox, remember && styles.checkboxChecked]}>
                  {remember ? <Text style={styles.checkmark}>✓</Text> : null}
                </View>
                <Text style={styles.rememberText}>Remember me</Text>
              </Pressable>

              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <Pressable
                style={[styles.primaryBtn, loading && styles.btnDisabled]}
                onPress={signIn}
                disabled={loading}
                accessibilityRole="button"
              >
                {loading ? (
                  <ActivityIndicator color={theme.light.white} size="small" />
                ) : (
                  <Text style={styles.primaryBtnText}>Sign In</Text>
                )}
              </Pressable>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
                <View style={styles.dividerLine} />
              </View>

              <Pressable
                style={[styles.googleBtn, loading && styles.btnDisabled]}
                onPress={signInWithGoogle}
                disabled={loading}
                accessibilityRole="button"
              >
                <GoogleLogo />
                <Text style={styles.googleText}>Google</Text>
              </Pressable>

              <Text style={styles.footer}>
                Don&apos;t have an account?{' '}
                <Text style={styles.footerLink} onPress={openWebAuth}>
                  Create one
                </Text>
              </Text>
            </>
          ) : forgotSent ? (
            <View style={styles.forgotSent}>
              <View style={styles.sentIcon}>
                <Icon icon={GraduationCap} size={26} color={solid} strokeWidth={1.9} />
              </View>
              <Text style={styles.sentHeading}>Check Your Email</Text>
              <Text style={styles.sentBody}>
                We&apos;ve sent a password reset link to <Text style={styles.sentEmail}>{forgotEmail}</Text>
              </Text>
              <Pressable style={styles.primaryBtn} onPress={backToLogin} accessibilityRole="button">
                <Text style={styles.primaryBtnText}>Back to Sign In</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={styles.header}>
                <Text style={styles.eyebrow}>Reset Password</Text>
                <Text style={styles.heading}>We&apos;ll send you a recovery link</Text>
              </View>

              <Text style={styles.forgotHint}>
                Enter the email address associated with your account and we&apos;ll send you a link to reset your password.
              </Text>

              <View style={styles.field}>
                <Label text="Email" />
                <GlassSurface radius={glassRadius.lozenge} intensity="regular" fill={theme.glass.fill} style={styles.inputShell}>
                  <TextInput
                    style={styles.input}
                    placeholder="you@example.com"
                    placeholderTextColor={theme.light.inkFaint}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                    value={forgotEmail}
                    onChangeText={setForgotEmail}
                  />
                </GlassSurface>
                {forgotError ? <Text style={styles.fieldError}>{forgotError}</Text> : null}
              </View>

              {forgotError ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{forgotError}</Text>
                </View>
              ) : null}

              <Pressable
                style={[styles.primaryBtn, forgotLoading && styles.btnDisabled]}
                onPress={sendResetLink}
                disabled={forgotLoading}
                accessibilityRole="button"
              >
                {forgotLoading ? (
                  <ActivityIndicator color={theme.light.white} size="small" />
                ) : (
                  <Text style={styles.primaryBtnText}>Send Reset Link</Text>
                )}
              </Pressable>

              <Text style={styles.footer}>
                Remember your password?{' '}
                <Text style={styles.footerLink} onPress={backToLogin}>
                  Sign in
                </Text>
              </Text>
            </>
          )}
        </View>
      </GlassScreen>
    </KeyboardAvoidingView>
  );
}

function GoogleLogo() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </Svg>
  );
}

const makeStyles = (theme: GlassTheme) => {
  const solid = theme.accents[ACCENT].solid;
  return StyleSheet.create({
  flex: { flex: 1 },
  screen: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  brand: { alignItems: 'center', gap: 8, marginBottom: spacing.xxxl },
  logo: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  brandName: { ...theme.glassType.label, fontSize: 14, letterSpacing: 8, color: theme.light.ink },
  brandTagline: { ...theme.glassType.caption, fontSize: 13, letterSpacing: 0.4 },
  body: { gap: spacing.xl },
  header: { marginBottom: spacing.xs },
  eyebrow: {
    ...theme.glassType.overline,
    fontSize: 12,
    letterSpacing: 2.4,
    color: solid,
    marginBottom: spacing.sm,
  },
  heading: {
    ...theme.glassType.title,
    fontSize: 30,
    fontWeight: '600',
    letterSpacing: -0.6,
    color: theme.light.ink,
    lineHeight: 38,
    maxWidth: '92%',
  },
  field: { gap: spacing.sm },
  label: {
    ...theme.glassType.overline,
    fontSize: 10,
    letterSpacing: 2,
    color: theme.light.inkMuted,
    paddingLeft: spacing.sm,
  },
  inputShell: { borderColor: theme.light.hairline, flexDirection: 'row', alignItems: 'center' },
  input: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    color: theme.light.ink,
    fontSize: 16,
    fontWeight: '500',
  },
  eyeToggle: { paddingHorizontal: spacing.lg, justifyContent: 'center' },
  fieldError: {
    color: theme.accents.data.solid,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    paddingLeft: spacing.sm,
  },
  forgotRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: spacing.xs },
  forgot: { ...theme.glassType.label, fontSize: 12, color: solid },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: theme.light.inkFaint,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.glass.fill,
  },
  checkboxChecked: { backgroundColor: solid, borderColor: solid },
  checkmark: { color: theme.light.white, fontSize: 13, fontWeight: '900' },
  rememberText: { ...theme.glassType.label, fontSize: 13, color: theme.light.inkSoft },
  errorBox: {
    backgroundColor: theme.accents.data.wash,
    borderColor: 'rgba(224,90,84,0.3)',
    borderWidth: 1,
    borderRadius: glassRadius.lozenge,
    padding: spacing.md,
  },
  errorText: {
    color: theme.accents.data.solid,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  primaryBtn: {
    backgroundColor: theme.light.ink,
    borderRadius: glassRadius.lozenge,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.light.ink,
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    marginTop: spacing.xs,
  },
  btnDisabled: { opacity: 0.5 },
  primaryBtnText: { ...theme.glassType.label, color: theme.light.white, fontSize: 16, fontWeight: '700' },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: theme.light.hairline },
  dividerText: { ...theme.glassType.overline, fontSize: 9, letterSpacing: 2.5, color: theme.light.inkFaint },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    borderColor: theme.light.hairline,
    borderWidth: 1,
    borderRadius: glassRadius.lozenge,
    paddingVertical: spacing.lg,
    backgroundColor: theme.glass.fill,
  },
  googleText: { ...theme.glassType.label, fontSize: 14, fontWeight: '600', color: theme.light.inkSoft },
  footer: {
    textAlign: 'center',
    ...theme.glassType.caption,
    color: theme.light.inkMuted,
  },
  footerLink: { color: solid, fontWeight: '700' },
  forgotHint: { ...theme.glassType.caption, fontSize: 13, lineHeight: 20, color: theme.light.inkSoft },
  forgotSent: { alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.xl },
  sentIcon: {
    width: 62,
    height: 62,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.accents[ACCENT].wash,
  },
  sentHeading: {
    ...theme.glassType.title,
    fontSize: 24,
    fontWeight: '600',
    color: theme.light.ink,
    marginTop: spacing.xs,
  },
  sentBody: { ...theme.glassType.caption, fontSize: 14, lineHeight: 22, color: theme.light.inkSoft, textAlign: 'center' },
  sentEmail: { color: theme.light.ink, fontWeight: '600' },
  });
};
