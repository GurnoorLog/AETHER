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
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { ensureUserData } from '@/lib/onboarding';

import { useTheme, glassRadius, spacing, type GlassTheme } from '@/theme';
import { GlassScreen } from '@/components/glass/GlassScreen';
import { GlassSurface } from '@/components/glass/GlassSurface';
import { Icon } from '@/components/glass/Icon';
import { Eye, EyeOff, GraduationCap } from '@/components/glass/icons';

const ACCENT = 'home';

function Label({ text }: { text: string }) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return <Text style={styles.label}>{text}</Text>;
}

export default function AuthScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const solid = theme.accents[ACCENT].solid;

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
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

  if (sent) {
    return (
      <GlassScreen scroll accent={ACCENT} contentStyle={styles.screen}>
        <View style={styles.sentIcon}>
          <Icon icon={GraduationCap} size={26} color={solid} strokeWidth={1.9} />
        </View>
        <Text style={styles.sentHeading}>Check Your Email</Text>
        <Text style={styles.sentBody}>
          We&apos;ve sent a confirmation link to <Text style={styles.sentEmail}>{email}</Text>. Confirm your email, then sign in to finish setting up your account.
        </Text>
        <Pressable style={styles.primaryBtn} onPress={() => router.replace('/login')} accessibilityRole="button">
          <Text style={styles.primaryBtnText}>Back to Sign In</Text>
        </Pressable>
      </GlassScreen>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <GlassScreen scroll accent={ACCENT} contentStyle={styles.screen}>
        <View style={styles.brand}>
          <GlassSurface radius={glassRadius.pill} intensity="thick" fill={theme.glass.fillStrong} tintColor={theme.accents[ACCENT].wash} style={styles.logo}>
            <Icon icon={GraduationCap} size={26} color={solid} strokeWidth={1.9} />
          </GlassSurface>
          <Text style={styles.brandName}>AETHER</Text>
          <Text style={styles.brandTagline}>Your personal AI tutor that never forgets.</Text>
        </View>

        <View style={styles.body}>
          <View style={styles.header}>
            <Text style={styles.eyebrow}>Create Account</Text>
            <Text style={styles.heading}>Start your personalized learning experience</Text>
          </View>

          <View style={styles.field}>
            <Label text="Full Name" />
            <GlassSurface radius={glassRadius.lozenge} intensity="regular" fill={theme.glass.fill} style={styles.inputShell}>
              <TextInput
                style={styles.input}
                placeholder="Sarah Johnson"
                placeholderTextColor={theme.light.inkFaint}
                autoCapitalize="words"
                autoComplete="name"
                value={fullName}
                onChangeText={setFullName}
              />
            </GlassSurface>
            {fieldErrors.name ? <Text style={styles.fieldError}>{fieldErrors.name}</Text> : null}
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
            {fieldErrors.email ? <Text style={styles.fieldError}>{fieldErrors.email}</Text> : null}
          </View>

          <View style={styles.field}>
            <Label text="Password" />
            <GlassSurface radius={glassRadius.lozenge} intensity="regular" fill={theme.glass.fill} style={styles.inputShell}>
              <TextInput
                style={styles.input}
                placeholder="Min. 8 characters"
                placeholderTextColor={theme.light.inkFaint}
                secureTextEntry={!showPassword}
                autoComplete="new-password"
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
            {fieldErrors.password ? <Text style={styles.fieldError}>{fieldErrors.password}</Text> : null}
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Pressable
            style={[styles.primaryBtn, loading && styles.btnDisabled]}
            onPress={signUp}
            disabled={loading}
            accessibilityRole="button"
          >
            {loading ? (
              <ActivityIndicator color={theme.light.white} size="small" />
            ) : (
              <Text style={styles.primaryBtnText}>Create Account</Text>
            )}
          </Pressable>

          <Text style={styles.footer}>
            Already have an account?{' '}
            <Text style={styles.footerLink} onPress={() => router.replace('/login')}>
              Sign in
            </Text>
          </Text>
        </View>
      </GlassScreen>
    </KeyboardAvoidingView>
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
    footer: {
      textAlign: 'center',
      ...theme.glassType.caption,
      color: theme.light.inkMuted,
    },
    footerLink: { color: solid, fontWeight: '700' },
    sentIcon: {
      width: 62,
      height: 62,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.accents[ACCENT].wash,
      alignSelf: 'center',
      marginBottom: spacing.lg,
    },
    sentHeading: {
      ...theme.glassType.title,
      fontSize: 24,
      fontWeight: '600',
      color: theme.light.ink,
      marginTop: spacing.xs,
      textAlign: 'center',
    },
    sentBody: {
      ...theme.glassType.caption,
      fontSize: 14,
      lineHeight: 22,
      color: theme.light.inkSoft,
      textAlign: 'center',
      maxWidth: '90%',
      alignSelf: 'center',
    },
    sentEmail: { color: theme.light.ink, fontWeight: '600' },
  });
};
