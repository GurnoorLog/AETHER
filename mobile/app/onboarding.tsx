import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { completeOnboarding, SUBJECTS, EDUCATION_LEVELS, LEARNING_STYLES, GOALS } from '@/lib/onboarding';
import { PricingModal } from '@/components/PricingModal';

import { useTheme, glassRadius, spacing, type GlassTheme } from '@/theme';
import { GlassScreen } from '@/components/glass/GlassScreen';
import { Icon } from '@/components/glass/Icon';
import { Check, Sparkles } from '@/components/glass/icons';

const ACCENT = 'home';

const STEPS = ['Name', 'Subjects', 'Level', 'Learning style', 'Goals', 'Voice'];

export default function OnboardingScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const solid = theme.accents[ACCENT].solid;
  const { session } = useAuth();

  const [step, setStep] = useState(0);
  const [name, setName] = useState(session?.user.user_metadata?.full_name ?? '');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [customSubject, setCustomSubject] = useState('');
  const [education, setEducation] = useState('');
  const [learningStyles, setLearningStyles] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPricing, setShowPricing] = useState(false);

  const toggle = (list: string[], set: (v: string[]) => void, value: string) =>
    set(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);

  const canContinue =
    step === 0 ? !!name.trim() :
    step === 1 ? subjects.length > 0 || !!customSubject.trim() :
    step === 2 ? !!education :
    step === 3 ? learningStyles.length > 0 :
    step === 4 ? goals.length > 0 :
    voiceEnabled !== null;

  const next = () => {
    setError('');
    if (step === 1 && customSubject.trim()) {
      const all = [...subjects];
      if (!all.includes(customSubject.trim())) all.push(customSubject.trim());
      setSubjects(all);
      setCustomSubject('');
    }
    setStep((s) => Math.min(s + 1, STEPS.length));
  };

  const finish = async () => {
    if (!session?.user) return;
    setSaving(true);
    setError('');
    const preferences = {
      subjects,
      education_level: education,
      learning_style: learningStyles,
      goals,
      voice_enabled: voiceEnabled,
    };
    const result = await completeOnboarding({
      userId: session.user.id,
      fullName: name.trim(),
      email: session.user.email ?? '',
      subjects,
      preferences,
    });
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setShowPricing(true);
  };

  const renderBody = () => {
    switch (step) {
      case 0:
        return (
          <TextInput
            style={styles.input}
            placeholder="Type your name..."
            placeholderTextColor={theme.light.inkFaint}
            autoCapitalize="words"
            autoComplete="name"
            value={name}
            onChangeText={setName}
          />
        );
      case 1:
        return (
          <>
            <View style={styles.chipWrap}>
              {SUBJECTS.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => toggle(subjects, setSubjects, s)}
                  style={[styles.chip, subjects.includes(s) && styles.chipOn]}
                >
                  <Text style={[styles.chipText, subjects.includes(s) && styles.chipTextOn]}>{s}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              style={styles.input}
              placeholder="Or type your own..."
              placeholderTextColor={theme.light.inkFaint}
              autoCapitalize="words"
              value={customSubject}
              onChangeText={setCustomSubject}
            />
          </>
        );
      case 2:
        return (
          <View style={styles.rowWrap}>
            {EDUCATION_LEVELS.map((level) => (
              <Pressable
                key={level}
                onPress={() => setEducation(level)}
                style={[styles.row, education === level && styles.rowOn]}
              >
                <Text style={[styles.rowText, education === level && styles.rowTextOn]}>{level}</Text>
              </Pressable>
            ))}
          </View>
        );
      case 3:
        return (
          <View style={styles.rowWrap}>
            {LEARNING_STYLES.map((s) => (
              <Pressable
                key={s.id}
                onPress={() => toggle(learningStyles, setLearningStyles, s.id)}
                style={[styles.row, learningStyles.includes(s.id) && styles.rowOn]}
              >
                <Text style={[styles.rowText, learningStyles.includes(s.id) && styles.rowTextOn]}>{s.label}</Text>
              </Pressable>
            ))}
          </View>
        );
      case 4:
        return (
          <View style={styles.chipWrap}>
            {GOALS.map((g) => (
              <Pressable
                key={g}
                onPress={() => toggle(goals, setGoals, g)}
                style={[styles.chip, goals.includes(g) && styles.chipOn]}
              >
                <Text style={[styles.chipText, goals.includes(g) && styles.chipTextOn]}>{g}</Text>
              </Pressable>
            ))}
          </View>
        );
      case 5:
        return (
          <View style={styles.voiceWrap}>
            <Pressable
              onPress={() => setVoiceEnabled(true)}
              style={[styles.voiceCard, voiceEnabled === true && styles.voiceOn]}
            >
              <Text style={styles.voiceTitle}>Yes, enable voice</Text>
              <Text style={styles.voiceSub}>Natural voice conversations with real-time AI</Text>
            </Pressable>
            <Pressable
              onPress={() => setVoiceEnabled(false)}
              style={[styles.voiceCard, voiceEnabled === false && styles.voiceOn]}
            >
              <Text style={styles.voiceTitle}>Text only</Text>
              <Text style={styles.voiceSub}>I prefer typing my questions</Text>
            </Pressable>
          </View>
        );
    }
  };

  return (
    <GlassScreen scroll accent={ACCENT} contentStyle={styles.screen}>
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.logo}>
            <Icon icon={Sparkles} size={16} color={solid} strokeWidth={2} />
          </View>
          <Text style={styles.brandName}>AETHER</Text>
        </View>
        <Text style={styles.eyebrow}>Welcome</Text>
        <Text style={styles.heading}>{step === 0 ? "Let's get to know you" : STEPS[step]}</Text>
      </View>

      <View style={styles.progress}>
        {STEPS.map((_, i) => (
          <View key={i} style={[styles.dot, i <= step && styles.dotOn]} />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {renderBody()}

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Pressable
          style={[styles.primaryBtn, !canContinue && styles.btnDisabled, saving && styles.btnDisabled]}
          onPress={step < STEPS.length - 1 ? next : finish}
          disabled={!canContinue || saving}
          accessibilityRole="button"
        >
          {saving ? (
            <ActivityIndicator color={theme.light.white} size="small" />
          ) : (
            <Text style={styles.primaryBtnText}>{step < STEPS.length - 1 ? 'Continue' : 'Start Learning'}</Text>
          )}
        </Pressable>
        {step > 0 && (
          <Pressable onPress={() => setStep((s) => s - 1)} hitSlop={8} accessibilityRole="button">
            <Text style={styles.back}>Back</Text>
          </Pressable>
        )}
      </ScrollView>

      <PricingModal open={showPricing} onClose={() => router.replace('/(tabs)')} />
    </GlassScreen>
  );
}

const makeStyles = (theme: GlassTheme) => {
  const solid = theme.accents[ACCENT].solid;
  return StyleSheet.create({
    screen: { flexGrow: 1, paddingVertical: spacing.xl },
    header: { paddingHorizontal: spacing.lg, gap: spacing.xs, marginBottom: spacing.lg },
    brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
    logo: {
      width: 28,
      height: 28,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.accents[ACCENT].wash,
    },
    brandName: { ...theme.glassType.label, fontSize: 12, letterSpacing: 5, color: theme.light.ink },
    eyebrow: { ...theme.glassType.overline, fontSize: 12, letterSpacing: 2.4, color: solid },
    heading: {
      ...theme.glassType.title,
      fontSize: 30,
      fontWeight: '600',
      letterSpacing: -0.6,
      color: theme.light.ink,
      lineHeight: 38,
    },
    progress: { flexDirection: 'row', gap: 6, paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.light.hairline },
    dotOn: { backgroundColor: solid, width: 18 },
    body: { paddingHorizontal: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },
    input: {
      borderColor: theme.light.hairline,
      borderWidth: 1,
      borderRadius: glassRadius.lozenge,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.lg,
      color: theme.light.ink,
      fontSize: 16,
      fontWeight: '500',
      backgroundColor: theme.glass.fill,
    },
    chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    chip: {
      borderColor: theme.light.hairline,
      borderWidth: 1,
      borderRadius: glassRadius.lozenge,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: theme.glass.fill,
    },
    chipOn: { backgroundColor: solid, borderColor: solid },
    chipText: { ...theme.glassType.label, fontSize: 13, color: theme.light.inkSoft },
    chipTextOn: { color: theme.light.white, fontWeight: '700' },
    rowWrap: { gap: spacing.sm },
    row: {
      borderColor: theme.light.hairline,
      borderWidth: 1,
      borderRadius: glassRadius.lozenge,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.xl,
      backgroundColor: theme.glass.fill,
    },
    rowOn: { backgroundColor: solid, borderColor: solid },
    rowText: { ...theme.glassType.label, fontSize: 14, color: theme.light.inkSoft },
    rowTextOn: { color: theme.light.white, fontWeight: '700' },
    voiceWrap: { gap: spacing.lg },
    voiceCard: {
      borderColor: theme.light.hairline,
      borderWidth: 1,
      borderRadius: glassRadius.card,
      padding: spacing.xl,
      backgroundColor: theme.glass.fill,
      gap: spacing.xs,
    },
    voiceOn: { borderColor: solid, backgroundColor: theme.accents[ACCENT].wash },
    voiceTitle: { ...theme.glassType.label, fontSize: 15, fontWeight: '700', color: theme.light.ink },
    voiceSub: { ...theme.glassType.caption, fontSize: 13, color: theme.light.inkMuted },
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
      marginTop: spacing.sm,
    },
    btnDisabled: { opacity: 0.5 },
    primaryBtnText: { ...theme.glassType.label, color: theme.light.white, fontSize: 16, fontWeight: '700' },
    back: { ...theme.glassType.label, fontSize: 13, color: theme.light.inkSoft, textAlign: 'center', marginTop: spacing.sm },
  });
};
