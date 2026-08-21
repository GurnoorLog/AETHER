import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useActiveSession } from '@/lib/activeSession';
import type { RoadmapModule } from '@/lib/types';
import { glassRadius, spacing, useTheme, type GlassTheme } from '@/theme';
import { GlassCard } from '@/components/glass/GlassCard';
import { GlassScreen } from '@/components/glass/GlassScreen';
import { GlassSurface } from '@/components/glass/GlassSurface';
import { Icon } from '@/components/glass/Icon';
import { ArrowRight, ChartColumn, Check, Map, MessageSquareText, Plus, Trophy, BookOpen } from '@/components/glass/icons';

export default function HomeTab() {
  const { session: authSession } = useAuth();
  const { session } = useActiveSession();
  const [modules, setModules] = useState<RoadmapModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileName, setProfileName] = useState('');

  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const fetchModules = useCallback(async () => {
    if (!authSession || !session) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('session_roadmap_modules')
      .select('id, session_id, user_id, module_index, title, description, status, lessons, learning_objectives, key_concepts, completed_at, created_at')
      .eq('session_id', session.id)
      .eq('user_id', authSession.user.id)
      .order('module_index', { ascending: true });
    if (data) {
      setModules((data as RoadmapModule[]).map((m) => ({
        ...m,
        lessons: typeof m.lessons === 'string' ? JSON.parse(m.lessons) : (m.lessons || []),
      })));
    }
    setLoading(false);
  }, [authSession, session]);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  useEffect(() => {
    if (!authSession) return;
    supabase
      .from('user_profiles')
      .select('full_name')
      .eq('user_id', authSession.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.full_name) setProfileName(data.full_name.split(' ')[0]);
      });
  }, [authSession]);

  const completedCount = modules.filter((m) => m.status === 'completed').length;
  const currentModule = modules.find((m) => m.status === 'current');
  const progress = modules.length > 0 ? Math.round((completedCount / modules.length) * 100) : 0;

  if (!session) {
    return (
      <GlassScreen scroll accent="home">
        <Text style={styles.bigTitle}>Home</Text>
        <GlassCard>
          <View style={styles.noSession}>
            <Icon icon={BookOpen} size={28} color={theme.accents.home.solid} />
            <Text style={theme.glassType.subtitle}>No session selected</Text>
            <Text style={theme.glassType.body}>Pick a session from the Hub to see its dashboard here.</Text>
            <Pressable style={styles.hubButton} onPress={() => router.push('/(tabs)')} accessibilityRole="button">
              <Text style={styles.hubButtonText}>GO TO HUB</Text>
            </Pressable>
          </View>
        </GlassCard>
      </GlassScreen>
    );
  }

  return (
    <GlassScreen scroll accent="home">
      {/* Hero */}
      <LinearGradient colors={[...theme.accents.home.gradient]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <View style={styles.heroBadges}>
          <View style={[styles.badge, styles.badgeDark]}>
            <Text style={styles.badgeDarkText} numberOfLines={1}>{session.title}</Text>
          </View>
          <View style={styles.badgeLight}>
            <Text style={styles.badgeLightText}>{modules.length} Modules</Text>
          </View>
        </View>
        <Text style={styles.heroLabel}>SESSION DASHBOARD</Text>
        <Text style={styles.heroTitle} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.7}>
          {currentModule
            ? `Continue "${currentModule.title}"`
            : completedCount === modules.length && modules.length > 0
              ? 'All Complete!'
              : `Welcome to ${session.subject || 'your session'}`}
        </Text>
        <View style={styles.progressBlock}>
          <View style={styles.heroTrack}>
            <View style={[styles.heroTrackFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressPct}>{progress}%</Text>
        </View>
      </LinearGradient>

      {/* Quick Actions */}
      <View style={styles.quickGrid}>
        {currentModule ? (
          <GlassCard style={styles.quickCard}>
            <Pressable onPress={() => router.push('/(tabs)/tutor')} accessibilityRole="button">
              <Icon icon={MessageSquareText} size={20} color={theme.accents.home.solid} />
              <Text style={styles.quickLabel}>CONTINUE LEARNING</Text>
              <Text style={styles.quickTitle}>{currentModule.title}</Text>
              <Text style={styles.quickDesc}>Start or resume this module</Text>
            </Pressable>
          </GlassCard>
        ) : null}
        <GlassCard style={styles.quickCard}>
          <Pressable onPress={() => router.push('/(tabs)/roadmap')} accessibilityRole="button">
            <Icon icon={Map} size={20} color={theme.accents.field.solid} />
            <Text style={styles.quickLabel}>ROADMAP</Text>
            <Text style={styles.quickTitle}>View Module Sequence</Text>
            <Text style={styles.quickDesc}>Lessons, objectives &amp; key concepts</Text>
          </Pressable>
        </GlassCard>
        <GlassCard style={styles.quickCard}>
          <Pressable onPress={() => router.push('/(tabs)/progress')} accessibilityRole="button">
            <Icon icon={ChartColumn} size={20} color={theme.accents.home.solid} />
            <Text style={styles.quickLabel}>PROGRESS</Text>
            <Text style={styles.quickTitle}>Check In</Text>
            <Text style={styles.quickDesc}>Mastery, streak, XP &amp; milestones</Text>
          </Pressable>
        </GlassCard>
        <GlassCard style={styles.quickCard}>
          <Pressable onPress={() => router.push('/(tabs)/tutor')} accessibilityRole="button">
            <Icon icon={Map} size={20} color={theme.accents.field.solid} />
            <Text style={styles.quickLabel}>TUTOR</Text>
            <Text style={styles.quickTitle}>Chat with Aether</Text>
            <Text style={styles.quickDesc}>Ask anything about this subject</Text>
          </Pressable>
        </GlassCard>
        <GlassCard style={styles.quickCard}>
          <Pressable onPress={() => router.push('/(tabs)/quizzes')} accessibilityRole="button">
            <Icon icon={Trophy} size={20} color={theme.accents.audio.solid} />
            <Text style={styles.quickLabel}>TEST KNOWLEDGE</Text>
            <Text style={styles.quickTitle}>Quizzes</Text>
            <Text style={styles.quickDesc}>Take a quiz on any module</Text>
          </Pressable>
        </GlassCard>
      </View>

      {/* Module Overview */}
      <Text style={styles.sectionLabel}>MODULE OVERVIEW</Text>
      {loading ? (
        <GlassCard><Text style={theme.glassType.body}>Loading your roadmap...</Text></GlassCard>
      ) : modules.length === 0 ? (
        <GlassCard><Text style={theme.glassType.body}>No modules yet. Create a new session from the Hub.</Text></GlassCard>
      ) : (
        modules.map((mod) => {
          const isCompleted = mod.status === 'completed';
          const isCurrent = mod.status === 'current';
          const lessonCount = Array.isArray(mod.lessons) ? mod.lessons.length : 0;
          return (
            <GlassCard key={mod.id} style={[styles.moduleCard, isCompleted ? styles.moduleDone : isCurrent ? null : styles.moduleLocked]}>
              <Pressable
                onPress={() => (isCurrent ? router.push('/(tabs)/tutor') : undefined)}
                accessibilityRole={isCurrent ? 'button' : undefined}
                style={styles.moduleRow}
              >
                <View style={[styles.moduleIndex, { backgroundColor: isCompleted ? 'rgba(31,180,154,0.14)' : isCurrent ? theme.accents.home.wash : theme.inkEdge(0.05) }]}>
                  {isCompleted ? (
                    <Icon icon={Check} size={15} color={theme.accents.audio.solid} strokeWidth={2.5} />
                  ) : (
                    <Text style={[styles.moduleNum, { color: isCurrent ? theme.accents.home.solid : theme.light.inkFaint }]}>{mod.module_index + 1}</Text>
                  )}
                </View>
                <View style={styles.moduleText}>
                  <Text style={[styles.moduleTitle, { color: isCurrent ? theme.light.ink : isCompleted ? theme.light.inkMuted : theme.light.inkFaint }]} numberOfLines={1}>
                    {mod.title}
                  </Text>
                  <Text style={styles.moduleMeta}>
                    {lessonCount} lessons{isCompleted ? ' · Completed' : ''}
                  </Text>
                </View>
                {isCurrent ? (
                  <View style={styles.currentPill}>
                    <Text style={[styles.currentPillText, { color: theme.accents.home.solid }]}>CURRENT</Text>
                  </View>
                ) : null}
                {isCurrent ? <Icon icon={ArrowRight} size={15} color={theme.light.inkFaint} /> : null}
              </Pressable>
            </GlassCard>
          );
        })
      )}
    </GlassScreen>
  );
}

const makeStyles = (theme: GlassTheme) => StyleSheet.create({
  bigTitle: { ...theme.glassType.title, fontSize: 32, fontWeight: '200', letterSpacing: -0.8, marginBottom: spacing.lg },
  noSession: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg },
  hubButton: {
    marginTop: spacing.md,
    backgroundColor: theme.light.ink,
    borderRadius: glassRadius.pill,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  hubButtonText: { ...theme.glassType.label, color: theme.light.white, fontSize: 12 },
  hero: {
    borderRadius: glassRadius.squircle,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  heroBadges: { flexDirection: 'row', gap: spacing.sm },
  badge: { paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: glassRadius.pill },
  badgeDark: { backgroundColor: '#181425' },
  badgeDarkText: { ...theme.glassType.overline, color: '#FFF', fontSize: 8, maxWidth: 220 },
  badgeLight: { backgroundColor: 'rgba(255,255,255,0.6)', borderWidth: 1, borderColor: 'rgba(24,20,37,0.1)' },
  badgeLightText: { ...theme.glassType.overline, color: 'rgba(24,20,37,0.7)', fontSize: 8 },
  heroLabel: { ...theme.glassType.overline, color: 'rgba(24,20,37,0.55)', marginTop: spacing.xs },
  heroTitle: { ...theme.glassType.title, fontSize: 24, lineHeight: 28, color: '#181425', fontWeight: '800' },
  progressBlock: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.xs },
  heroTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: 'rgba(24,20,37,0.15)', overflow: 'hidden' },
  heroTrackFill: { height: '100%', borderRadius: 4, backgroundColor: '#181425' },
  progressPct: { ...theme.glassType.label, fontSize: 16, color: '#181425', fontWeight: '800' },
  quickGrid: { gap: spacing.md, marginBottom: spacing.lg },
  quickCard: {},
  quickLabel: { ...theme.glassType.overline, fontSize: 9, color: theme.light.inkFaint, marginTop: spacing.sm, marginBottom: 2 },
  quickTitle: { ...theme.glassType.subtitle, fontSize: 15 },
  quickDesc: { ...theme.glassType.caption, color: theme.light.inkMuted, marginTop: 2 },
  sectionLabel: { ...theme.glassType.overline, color: theme.light.inkMuted, marginBottom: spacing.md },
  moduleCard: { marginBottom: spacing.sm },
  moduleDone: { opacity: 0.55 },
  moduleLocked: { opacity: 0.35 },
  moduleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  moduleIndex: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  moduleNum: { ...theme.glassType.label, fontSize: 13, fontWeight: '700' },
  moduleText: { flex: 1, minWidth: 0 },
  moduleTitle: { ...theme.glassType.label, fontSize: 13, fontWeight: '600' },
  moduleMeta: { ...theme.glassType.caption, color: theme.light.inkFaint, marginTop: 2 },
  currentPill: { backgroundColor: theme.accents.home.wash, borderRadius: glassRadius.pill, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  currentPillText: { ...theme.glassType.overline, fontSize: 8 },
});
