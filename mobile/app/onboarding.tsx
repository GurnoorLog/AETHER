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

const BG = require('../assets/design/onboarding_bg.jpg');
const LOGO = require('../assets/design/icon_logo.png');

const GREEN = '#5d8557';
const GREEN_DARK = '#4a6b45';
const CREAM = '#FFF9F0';
const INK = '#2D3748';
const INK_SOFT = '#718096';

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
        <Text style={styles.headlineSub}>A few quick questions so I can personalize your learning experience.</Text>
      </View>

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
    fontFamily: 'Outfit_700Bold',
    fontSize: 22,
    color: '#2c3530',
    letterSpacing: 2,
    lineHeight: 26,
  },
  brandTag: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11,
    color: GREEN,
    letterSpacing: 2,
    textTransform: 'uppercase',
    lineHeight: 14,
  },
  headline: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 34,
    lineHeight: 38,
    color: INK,
    letterSpacing: -0.5,
    marginBottom: 8,
    maxWidth: '70%',
  },
  headlineSub: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 15,
    lineHeight: 22,
    color: '#3a443e',
    maxWidth: '70%',
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
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13,
    color: INK_SOFT,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    marginHorizontal: 12,
    backgroundColor: '#e5e2da',
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
    fontFamily: 'Outfit_700Bold',
    fontSize: 22,
    lineHeight: 28,
    color: INK,
    marginBottom: 4,
  },
  questionSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    color: INK_SOFT,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  optionCard: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: '#fff',
    borderColor: '#f0eee9',
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  optionOn: {
    backgroundColor: '#f0f5f0',
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
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 13,
    lineHeight: 17,
    color: INK,
    flex: 1,
  },
  optionLabelOn: { color: '#2d4a2a' },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#d6d3cc',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: GREEN, borderColor: GREEN },
  checkboxCheck: { color: '#fff', fontSize: 12, fontWeight: '700' },
  input: {
    backgroundColor: '#fff',
    borderColor: '#f0eee9',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    color: INK,
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_400Regular',
    marginBottom: 24,
  },
  voiceWrap: { gap: 12, marginBottom: 24 },
  voiceCard: {
    backgroundColor: '#fff',
    borderColor: '#f0eee9',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  voiceOn: { backgroundColor: '#f0f5f0', borderColor: GREEN },
  voiceIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceTextWrap: { flex: 1 },
  voiceTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 15,
    color: INK,
    marginBottom: 2,
  },
  voiceSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: INK_SOFT,
  },
  infoBanner: {
    backgroundColor: '#f0f3ed',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 24,
  },
  infoIcon: { marginTop: 1 },
  infoText: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    lineHeight: 19,
    color: '#4a554f',
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
    height: 64,
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 32,
    paddingRight: 8,
    shadowColor: GREEN,
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  btnDisabled: { opacity: 0.5 },
  primaryBtnText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 17,
    color: '#fff',
  },
  primaryBtnCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  back: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14,
    color: GREEN,
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