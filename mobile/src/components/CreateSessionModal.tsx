import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';

import { supabase } from '@/lib/supabase';
import { createSession, type CreatedSession } from '@/lib/api';
import { useActiveSession } from '@/lib/activeSession';
import { glassRadius, spacing, useTheme, type AccentKey, type GlassTheme } from '@/theme';
import { GlassButton } from '@/components/glass/GlassButton';
import { GlassCard } from '@/components/glass/GlassCard';
import { GlassIconButton } from '@/components/glass/GlassIconButton';
import { GlassSurface } from '@/components/glass/GlassSurface';
import { Icon } from '@/components/glass/Icon';
import { GraduationCap, BookOpen, Brain, Rocket, Sparkles, X } from '@/components/glass/icons';

const PRESETS: { label: string; accent: AccentKey }[] = [
  { label: 'Mathematics', accent: 'home' },
  { label: 'Physics', accent: 'field' },
  { label: 'Biology', accent: 'audio' },
  { label: 'Chemistry', accent: 'feedback' },
  { label: 'History', accent: 'vocab' },
  { label: 'Literature', accent: 'voice' },
];

export function CreateSessionModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [subject, setSubject] = useState('');
  const [objectives, setObjectives] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<CreatedSession | null>(null);
  const { setSession } = useActiveSession();

  const close = () => {
    setCreated(null);
    setError('');
    setSubject('');
    setObjectives('');
    onClose();
  };

  const startLearning = () => {
    if (!created) return close();
    setSession({ id: created.sessionId, slug: created.slug, title: created.title, subject: subject });
    close();
    router.replace('/(tabs)/home');
  };

  const handleCreate = async () => {
    if (!subject.trim() || creating) return;
    setCreating(true);
    setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('subscription_tier')
        .eq('user_id', user.id)
        .maybeSingle();
      const tier = profile?.subscription_tier ?? 'free';
      if (tier === 'free') {
        const { count } = await supabase
          .from('sessions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id);
        if ((count ?? 0) >= 1) {
          setError('Free plan includes 1 active session. Upgrade to Pro for up to 10. Tap below to view plans.');
          setCreating(false);
          return;
        }
      }
      const result = await createSession({ subject: subject.trim(), objectives });
      setCreated(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={close} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{created ? 'Roadmap Ready' : 'New Study Session'}</Text>
            <GlassIconButton icon={X} onPress={close} accessibilityLabel="Close" size={34} />
          </View>

          {created ? (
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
              <View style={styles.readyRow}>
                <View style={[styles.readyIcon, { backgroundColor: theme.accents.home.wash }]}>
                  <Icon icon={Sparkles} size={22} color={theme.accents.home.solid} />
                </View>
                <View style={styles.readyText}>
                  <Text style={styles.readyTitle}>{created.title}</Text>
                  <Text style={styles.readySubtitle}>Your personalized learning path is ready.</Text>
                </View>
              </View>
              <GlassButton label="Start Learning" onPress={startLearning} size="lg" icon={Rocket} accent="home" />
            </ScrollView>
          ) : (
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>SUBJECT</Text>
              <View style={styles.presetGrid}>
                {PRESETS.map((p) => (
                  <Pressable
                    key={p.label}
                    onPress={() => setSubject(p.label)}
                    accessibilityRole="button"
                    accessibilityLabel={p.label}
                    style={styles.presetWrap}
                  >
                    <GlassSurface
                      radius={glassRadius.lozenge}
                      intensity={subject === p.label ? 'thick' : 'regular'}
                      fill={subject === p.label ? theme.glass.fillStrong : theme.glass.fillSubtle}
                      tintColor={subject === p.label ? theme.accents[p.accent].wash : undefined}
                      style={styles.preset}
                    >
                      <Icon
                        icon={p.label === 'Mathematics' ? Brain : p.label === 'Physics' ? Rocket : BookOpen}
                        size={20}
                        color={subject === p.label ? theme.accents[p.accent].solid : theme.light.inkMuted}
                      />
                      <Text style={[styles.presetLabel, { color: subject === p.label ? theme.light.ink : theme.light.inkMuted }]} numberOfLines={1}>
                        {p.label}
                      </Text>
                    </GlassSurface>
                  </Pressable>
                ))}
              </View>

              <TextInput
                style={styles.input}
                placeholder="Or type any topic you want to learn..."
                placeholderTextColor={theme.light.inkFaint}
                value={subject}
                onChangeText={setSubject}
                autoCapitalize="sentences"
              />

              <Text style={styles.label}>WHAT DO YOU WANT TO LEARN? (OPTIONAL)</Text>
              <TextInput
                style={[styles.input, styles.objectives]}
                placeholder="e.g. I want to understand derivatives and integrals for my exam next week..."
                placeholderTextColor={theme.light.inkFaint}
                value={objectives}
                onChangeText={setObjectives}
                multiline
                textAlignVertical="top"
              />

              {error ? (
                <GlassCard style={styles.errorCard}>
                  <Text style={styles.errorText}>{error}</Text>
                  <Pressable onPress={() => router.push('/pricing')} accessibilityRole="button" hitSlop={8}>
                    <Text style={styles.upgradeLink}>VIEW PLANS →</Text>
                  </Pressable>
                </GlassCard>
              ) : null}

              <GlassButton
                label={creating ? 'Generating your roadmap...' : 'Create Session'}
                onPress={handleCreate}
                loading={creating}
                disabled={!subject.trim()}
                size="lg"
                icon={GraduationCap}
                accent="home"
              />
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (theme: GlassTheme) => StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(24,20,37,0.45)' },
  sheet: {
    backgroundColor: theme.light.base,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '88%',
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  title: { ...theme.glassType.title, fontSize: 22 },
  content: { paddingHorizontal: spacing.xl, gap: spacing.lg },
  label: { ...theme.glassType.overline, color: theme.light.inkMuted, marginTop: spacing.xs },
  presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  presetWrap: { width: '30.8%' },
  preset: { paddingVertical: spacing.md, alignItems: 'center', gap: 6 },
  presetLabel: { ...theme.glassType.label, fontSize: 12 },
  input: {
    backgroundColor: theme.dark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.6)',
    borderColor: theme.inkEdge(0.1),
    borderWidth: 1,
    borderRadius: glassRadius.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: theme.light.ink,
    fontSize: 15,
  },
  objectives: { minHeight: 90, paddingTop: spacing.md },
  errorCard: { marginTop: spacing.xs },
  errorText: { ...theme.glassType.body, color: theme.accents.data.solid },
  upgradeLink: { ...theme.glassType.overline, color: theme.accents.home.solid, marginTop: spacing.xs },
  readyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginVertical: spacing.lg },
  readyIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  readyText: { flex: 1, gap: 4 },
  readyTitle: { ...theme.glassType.subtitle, fontSize: 17 },
  readySubtitle: { ...theme.glassType.body, color: theme.light.inkMuted },
});
