import { useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Outfit_700Bold, Outfit_800ExtraBold } from '@expo-google-fonts/outfit';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import {
  ArrowRight,
  Atom,
  Award,
  BookOpen,
  Brain,
  Briefcase,
  Calculator,
  ClipboardList,
  Code,
  Dna,
  Eye,
  FileText,
  Globe,
  GraduationCap,
  Landmark,
  Languages,
  Lightbulb,
  ListChecks,
  MessageCircle,
  MessageSquareText,
  Mic,
  PenLine,
  School,
  Stethoscope,
  Target,
  TrendingUp,
  University,
  Wrench,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { completeOnboarding, SUBJECTS, EDUCATION_LEVELS, LEARNING_STYLES, GOALS } from '@/lib/onboarding';
import { PricingModal } from '@/components/PricingModal';
import { SERIF, EDITORIAL } from '@/components/editorial';

const BG = require('../assets/design/onboarding_bg.jpg');
const LOGO = require('../assets/design/icon_logo.png');

const GREEN = EDITORIAL.forest;
const GREEN_DARK = '#31502f';
const CREAM = EDITORIAL.cream;
const INK = EDITORIAL.ink;
const INK_SOFT = EDITORIAL.inkMuted;

type IconChip = { icon: typeof BookOpen; bg: string; fg: string };

const GOAL_ICONS: Record<string, IconChip> = {
  'Pass exams': { icon: Target, bg: '#f5eef5', fg: '#9b73a8' },
  'Improve grades': { icon: TrendingUp, bg: '#fef5e8', fg: '#e1953e' },
  'Learn a new subject': { icon: Lightbulb, bg: '#fef5e8', fg: '#e1953e' },
  'Prepare for interviews': { icon: Briefcase, bg: '#edf3f8', fg: '#5b8bb3' },
  'Understand difficult concepts': { icon: Brain, bg: '#faeded', fg: '#d56c70' },
  'Build practical skills': { icon: Wrench, bg: '#f0f3ed', fg: '#688c52' },
};

const SUBJECT_ICONS: Record<string, IconChip> = {
  Mathematics: { icon: Calculator, bg: '#f0f3ed', fg: '#688c52' },
  'Computer Science': { icon: Code, bg: '#edf3f8', fg: '#5b8bb3' },
  Biology: { icon: Dna, bg: '#f0f3ed', fg: '#688c52' },
  Physics: { icon: Atom, bg: '#f5eef5', fg: '#9b73a8' },
  Medicine: { icon: Stethoscope, bg: '#faeded', fg: '#d56c70' },
  Engineering: { icon: Wrench, bg: '#fef5e8', fg: '#e1953e' },
  Languages: { icon: Languages, bg: '#edf3f8', fg: '#5b8bb3' },
  History: { icon: Landmark, bg: '#f5eef5', fg: '#9b73a8' },
  Psychology: { icon: Brain, bg: '#faeded', fg: '#d56c70' },
  Economics: { icon: TrendingUp, bg: '#f0f3ed', fg: '#688c52' },
};

const STYLE_ICONS: Record<string, IconChip> = {
  step_by_step: { icon: ListChecks, bg: '#f0f3ed', fg: '#688c52' },
  visual: { icon: Eye, bg: '#edf3f8', fg: '#5b8bb3' },
  real_world: { icon: Globe, bg: '#fef5e8', fg: '#e1953e' },
  conversations: { icon: MessageCircle, bg: '#f5eef5', fg: '#9b73a8' },
  practice: { icon: ClipboardList, bg: '#faeded', fg: '#d56c70' },
  summaries: { icon: FileText, bg: '#f0f3ed', fg: '#688c52' },
};

const LEVEL_ICONS: Record<string, IconChip> = {
  'High School': { icon: School, bg: '#f0f3ed', fg: '#688c52' },
  College: { icon: GraduationCap, bg: '#fef5e8', fg: '#e1953e' },
  University: { icon: University, bg: '#f5eef5', fg: '#9b73a8' },
  Graduate: { icon: Award, bg: '#edf3f8', fg: '#5b8bb3' },
  'Self Learner': { icon: BookOpen, bg: '#f0f3ed', fg: '#688c52' },
};

const STEPS = [
  {
    title: 'What should we call you?',
    sub: 'This is how Aether will greet you.',
  },
  {
    title: 'What are you studying?',
    sub: 'Choose all that apply',
  },
  {
    title: 'What\u2019s your education level?',
    sub: 'Pick the closest one',
  },
  {
    title: 'How do you learn best?',
    sub: 'Choose all that apply',
  },
  {
    title: 'What\u2019s your main goal for using Aether?',
    sub: 'Choose all that apply',
  },
  {
    title: 'Let\u2019s set up your voice',
    sub: 'Optional — you can change anytime',
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();

  const [fontsLoaded] = useFonts({
    Outfit_700Bold,
    Outfit_800ExtraBold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

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
            placeholderTextColor="#a8a29a"
            autoCapitalize="words"
            autoComplete="name"
            value={name}
            onChangeText={setName}
          />
        );
      case 1:
        return (
          <>
            <View style={styles.grid}>
              {SUBJECTS.map((s) => (
                <OptionCard
                  key={s}
                  label={s}
                  icon={SUBJECT_ICONS[s] ?? { icon: BookOpen, bg: '#f0f3ed', fg: '#688c52' }}
                  selected={subjects.includes(s)}
                  onPress={() => toggle(subjects, setSubjects, s)}
                />
              ))}
            </View>
            <TextInput
              style={styles.input}
              placeholder="Or type your own..."
              placeholderTextColor="#a8a29a"
              autoCapitalize="words"
              value={customSubject}
              onChangeText={setCustomSubject}
            />
          </>
        );
      case 2:
        return (
          <View style={styles.grid}>
            {EDUCATION_LEVELS.map((level) => (
              <OptionCard
                key={level}
                label={level}
                icon={LEVEL_ICONS[level] ?? { icon: BookOpen, bg: '#f0f3ed', fg: '#688c52' }}
                selected={education === level}
                onPress={() => setEducation(level)}
              />
            ))}
          </View>
        );
      case 3:
        return (
          <View style={styles.grid}>
            {LEARNING_STYLES.map((s) => (
              <OptionCard
                key={s.id}
                label={s.label}
                icon={STYLE_ICONS[s.id] ?? { icon: BookOpen, bg: '#f0f3ed', fg: '#688c52' }}
                selected={learningStyles.includes(s.id)}
                onPress={() => toggle(learningStyles, setLearningStyles, s.id)}
              />
            ))}
          </View>
        );
      case 4:
        return (
          <View style={styles.grid}>
            {GOALS.map((g) => (
              <OptionCard
                key={g}
                label={g}
                icon={GOAL_ICONS[g] ?? { icon: BookOpen, bg: '#f0f3ed', fg: '#688c52' }}
                selected={goals.includes(g)}
                onPress={() => toggle(goals, setGoals, g)}
              />
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
              <View style={[styles.voiceIcon, { backgroundColor: '#f0f3ed' }]}>
                <Mic size={20} color="#688c52" strokeWidth={2} />
              </View>
              <View style={styles.voiceTextWrap}>
                <Text style={styles.voiceTitle}>Yes, enable voice</Text>
                <Text style={styles.voiceSub}>Natural voice conversations with real-time AI</Text>
              </View>
            </Pressable>
            <Pressable
              onPress={() => setVoiceEnabled(false)}
              style={[styles.voiceCard, voiceEnabled === false && styles.voiceOn]}
            >
              <View style={[styles.voiceIcon, { backgroundColor: '#f5eef5' }]}>
                <MessageSquareText size={20} color="#9b73a8" strokeWidth={2} />
              </View>
              <View style={styles.voiceTextWrap}>
                <Text style={styles.voiceTitle}>Text only</Text>
                <Text style={styles.voiceSub}>I prefer typing my questions</Text>
              </View>
            </Pressable>
          </View>
        );
    }
  };

  if (!fontsLoaded) return null;

  const pct = Math.round(((step + 1) / STEPS.length) * 100);

  return (
    <ImageBackground source={BG} style={styles.root} imageStyle={styles.bgImage}>
      <StatusBar style="dark" />

      {/* Top overlay */}
      <View style={[styles.top, { paddingTop: insets.top + 12 }]}>
        <View style={styles.brand}>
          <View style={styles.logoWrap}>
            <ImageBackground source={LOGO} style={styles.logo} imageStyle={styles.logoRound} />
          </View>
          <View>
            <Text style={styles.brandName}>AETHER</Text>
            <Text style={styles.brandTag}>AI TUTOR</Text>
          </View>
        </View>
        <Text style={styles.headline}>Let&apos;s get to{'\n'}know you!</Text>
        <Text style={styles.headlineSub}>A few quick questions so I can personalize your learning experience.</Text>      </View>

      {/* Bottom card */}
      <ScrollView
        style={[styles.card, { maxHeight: Math.round(Dimensions.get('window').height * 0.62) }]}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Progress bar */}
        <View style={styles.progressRow}>
          <Text style={styles.progressText}>Step {step + 1} of {STEPS.length}</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${pct}%` }]} />
          </View>
          <Text style={styles.progressText}>{pct}%</Text>
        </View>

        {/* Question */}
        <View style={styles.question}>
          <Text style={styles.questionTitle}>{STEPS[step].title}</Text>
          <Text style={styles.questionSub}>{STEPS[step].sub}</Text>
        </View>

        {renderBody()}

        {step >= 1 && step <= 4 ? (
          <View style={styles.infoBanner}>
            <View style={styles.infoIcon}>
              <BookOpen size={18} color={GREEN} strokeWidth={2} />
            </View>
            <Text style={styles.infoText}>Your answers help me create a learning experience that&apos;s truly yours.</Text>
          </View>
        ) : null}

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
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Text style={styles.primaryBtnText}>{step < STEPS.length - 1 ? 'Next' : 'Start Learning'}</Text>
              <View style={styles.primaryBtnCircle}>
                <ArrowRight size={24} color={GREEN} strokeWidth={2.5} />
              </View>
            </>
          )}
        </Pressable>

        {step > 0 ? (
          <Pressable onPress={() => setStep((s) => s - 1)} hitSlop={8} accessibilityRole="button">
            <Text style={styles.back}>Back</Text>
          </Pressable>
        ) : null}
      </ScrollView>

      <PricingModal open={showPricing} onClose={() => router.replace('/(tabs)')} />
    </ImageBackground>
  );
}

function OptionCard({
  label,
  icon,
  selected,
  onPress,
}: {
  label: string;
  icon: IconChip;
  selected: boolean;
  onPress: () => void;
}) {
  const Icon = icon.icon;
  return (
    <Pressable onPress={onPress} style={[styles.optionCard, selected && styles.optionOn]}>
      <View style={[styles.optionIcon, { backgroundColor: icon.bg }]}>
        <Icon size={20} color={icon.fg} strokeWidth={2} />
      </View>
      <Text style={[styles.optionLabel, selected && styles.optionLabelOn]} numberOfLines={2}>
        {label}
      </Text>
      <View style={[styles.checkbox, selected && styles.checkboxOn]}>
        {selected ? <Text style={styles.checkboxCheck}>✓</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bgImage: { resizeMode: 'cover' },
  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    zIndex: 10,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  logoWrap: { width: 40, height: 40 },
  logo: { width: '100%', height: '100%' },
  logoRound: { borderRadius: 20 },
  brandName: {
    fontFamily: SERIF,
    fontWeight: '700',
    fontSize: 22,
    color: INK,
    letterSpacing: 2,
    lineHeight: 26,
  },
  brandTag: {
    fontFamily: SERIF,
    fontWeight: '600',
    fontSize: 11,
    color: GREEN,
    letterSpacing: 2,
    textTransform: 'uppercase',
    lineHeight: 14,
  },
  headline: {
    fontFamily: SERIF,
    fontWeight: '700',
    fontSize: 34,
    lineHeight: 40,
    color: INK,
    letterSpacing: -0.5,
    marginBottom: 8,
    maxWidth: '72%',
  },
  headlineSub: {
    fontFamily: SERIF,
    fontSize: 15,
    lineHeight: 22,
    color: INK_SOFT,
    maxWidth: '74%',
  },
  card: {
    backgroundColor: CREAM,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: -20 },
    elevation: 10,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  progressText: {
    fontFamily: SERIF,
    fontWeight: '600',
    fontSize: 12,
    color: INK_SOFT,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    marginHorizontal: 12,
    backgroundColor: '#E7E1D6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: GREEN,
    borderRadius: 3,
  },
  question: { marginBottom: 24 },
  questionTitle: {
    fontFamily: SERIF,
    fontWeight: '700',
    fontSize: 22,
    lineHeight: 28,
    color: INK,
    marginBottom: 4,
  },
  questionSub: {
    fontFamily: SERIF,
    fontSize: 14,
    color: INK_SOFT,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  optionCard: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: CREAM,
    borderColor: INK,
    borderWidth: 2,
    borderRadius: 14,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 5,
    padding: 14,
    gap: 10,
    boxShadow: '3px 3px 0 0 #2D3436',
  },
  optionOn: {
    backgroundColor: '#EFF2E8',
    borderColor: GREEN,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    fontFamily: SERIF,
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 18,
    color: INK,
    flex: 1,
  },
  optionLabelOn: { color: GREEN_DARK },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: INK,
    backgroundColor: CREAM,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: GREEN, borderColor: GREEN },
  checkboxCheck: { color: CREAM, fontSize: 12, fontWeight: '700' },
  input: {
    backgroundColor: CREAM,
    borderColor: INK,
    borderWidth: 2,
    borderRadius: 14,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 5,
    paddingHorizontal: 18,
    paddingVertical: 16,
    color: INK,
    fontSize: 15,
    fontFamily: SERIF,
    marginBottom: 24,
    boxShadow: '3px 3px 0 0 #2D3436',
  },
  voiceWrap: { gap: 12, marginBottom: 24 },
  voiceCard: {
    backgroundColor: CREAM,
    borderColor: INK,
    borderWidth: 2,
    borderRadius: 14,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 5,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    boxShadow: '3px 3px 0 0 #2D3436',
  },
  voiceOn: { backgroundColor: '#EFF2E8', borderColor: GREEN },
  voiceIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceTextWrap: { flex: 1 },
  voiceTitle: {
    fontFamily: SERIF,
    fontWeight: '700',
    fontSize: 15,
    color: INK,
    marginBottom: 2,
  },
  voiceSub: {
    fontFamily: SERIF,
    fontSize: 13,
    color: INK_SOFT,
  },
  infoBanner: {
    backgroundColor: '#EFF2E8',
    borderColor: EDITORIAL.forest,
    borderWidth: 1.5,
    borderRadius: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 5,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 4,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 24,
    transform: [{ rotate: '-0.5deg' }],
  },
  infoIcon: { marginTop: 1 },
  infoText: {
    flex: 1,
    fontFamily: SERIF,
    fontSize: 13,
    lineHeight: 19,
    color: '#4A554F',
  },
  errorBox: {
    backgroundColor: 'rgba(224,90,84,0.08)',
    borderColor: 'rgba(224,90,84,0.35)',
    borderWidth: 2,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  errorText: {
    color: '#C2604A',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
    fontFamily: SERIF,
  },
  primaryBtn: {
    backgroundColor: GREEN,
    borderColor: INK,
    borderWidth: 2,
    borderRadius: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 7,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 6,
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 28,
    paddingRight: 8,
    boxShadow: '4px 4px 0 0 #2D3436',
  },
  btnDisabled: { opacity: 0.4 },
  primaryBtnText: {
    fontFamily: SERIF,
    fontWeight: '700',
    fontSize: 17,
    color: CREAM,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  primaryBtnCircle: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderColor: INK,
    borderWidth: 1.5,
    backgroundColor: CREAM,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '2deg' }],
  },
  back: {
    fontFamily: SERIF,
    fontWeight: '600',
    fontSize: 14,
    color: GREEN,
    textDecorationLine: 'underline',
    textAlign: 'center',
    marginTop: 16,
  },
  homeIndicator: {
    width: 128,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.12)',
    alignSelf: 'center',
    marginTop: 28,
  },
});