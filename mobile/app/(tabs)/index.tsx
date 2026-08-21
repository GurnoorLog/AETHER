import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { AetherSession } from '@/lib/types';
import { useActiveSession } from '@/lib/activeSession';
import { mixHex } from '@/lib/color';
import { glassRadius, spacing, useTheme, type GlassTheme } from '@/theme';
import { CreateSessionModal } from '@/components/CreateSessionModal';
import { ProfileSheet } from '@/components/ProfileSheet';
import { GlassActionPill, GlassPageHeader } from '@/components/glass/GlassPageHeader';
import { GlassCard } from '@/components/glass/GlassCard';
import { GlassIconButton } from '@/components/glass/GlassIconButton';
import { GlassScreen } from '@/components/glass/GlassScreen';
import { GlassStat } from '@/components/glass/GlassStat';
import { Icon, type IconComponent } from '@/components/glass/Icon';
import {
  Atom,
  BookOpen,
  Brain,
  Calculator,
  ChartColumn,
  Code,
  Dna,
  Languages,
  Pill,
  Plus,
  Rocket,
  ScrollText,
  Trash2,
  TrendingUp,
  UserRound,
  Wrench,
} from '@/components/glass/icons';

const SUBJECT_ICON: Record<string, IconComponent> = {
  Mathematics: Calculator,
  'Computer Science': Code,
  Biology: Dna,
  Physics: Atom,
  Medicine: Pill,
  Engineering: Wrench,
  Languages: Languages,
  History: ScrollText,
  Psychology: Brain,
  Economics: TrendingUp,
};

const SUBJECT_COLOR: Record<string, string> = {
  Mathematics: '#8E77E6',
  'Computer Science': '#4386DE',
  Biology: '#1FB49A',
  Physics: '#A78BFA',
  Medicine: '#DB5F9E',
  Engineering: '#D89A2E',
  Languages: '#22D3EE',
  History: '#E08A2E',
  Psychology: '#EC4899',
  Economics: '#10B981',
};

function getSubject(title: string): string {
  return title.match(/^(.+?) Study Session$/) ? title.match(/^(.+?) Study Session$/)![1] : title;
}

function getSubjectIcon(title: string): IconComponent {
  return SUBJECT_ICON[getSubject(title)] || BookOpen;
}

function getSubjectColor(title: string, theme: GlassTheme): string {
  const c = SUBJECT_COLOR[getSubject(title)] || theme.accents.home.solid;
  return theme.dark ? mixHex(c, '#FFFFFF', 0.55) : c;
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

type Filter = 'all' | 'active' | 'done';

export default function HubTab() {
  const { session: authSession } = useAuth();
  const { setSession } = useActiveSession();
  const [sessions, setSessions] = useState<AetherSession[]>([]);
  const [mastery, setMastery] = useState<{ subject: string; mastery_level: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');

  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const fetchData = useCallback(async () => {
    if (!authSession) return;
    const [sessionsRes, masteryRes] = await Promise.all([
      supabase
        .from('sessions')
        .select('id, title, slug, subject, objectives, created_at, updated_at')
        .eq('user_id', authSession.user.id)
        .order('updated_at', { ascending: false }),
      supabase.from('progress_tracking').select('subject, mastery_level').eq('user_id', authSession.user.id),
    ]);
    if (sessionsRes.data) setSessions(sessionsRes.data as AetherSession[]);
    if (masteryRes.data) setMastery(masteryRes.data as { subject: string; mastery_level: number }[]);
    setLoading(false);
  }, [authSession]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getMastery = (title: string) => {
    const found = mastery.find((m) => m.subject === getSubject(title));
    return found ? found.mastery_level : 0;
  };

  const filtered = sessions.filter((s) => {
    const progress = getMastery(s.title);
    if (filter === 'active') return progress < 100;
    if (filter === 'done') return progress >= 100;
    return true;
  });

  const resume = (s: AetherSession) => {
    setSession({ id: s.id, slug: s.slug, title: s.title, subject: s.subject });
    router.push('/(tabs)/home');
  };

  const deleteSession = (s: AetherSession) => {
    Alert.alert('Delete session', `Delete "${s.title}" and all its data?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { data: convs } = await supabase.from('conversations').select('id').eq('session_id', s.id);
          if (convs) {
            for (const conv of convs) {
              await supabase.from('chat_messages').delete().eq('conversation_id', conv.id);
            }
          }
          await supabase.from('conversations').delete().eq('session_id', s.id);
          await supabase.from('document_chunks').delete().eq('session_id', s.id);
          await supabase.from('documents').delete().eq('session_id', s.id);
          await supabase.from('kingdom_events').delete().eq('session_id', s.id);
          await supabase.from('session_kingdom').delete().eq('session_id', s.id);
          await supabase.from('session_quizzes').delete().eq('session_id', s.id);
          await supabase.from('session_roadmap_modules').delete().eq('session_id', s.id);
          await supabase.from('progress_tracking').delete().eq('session_id', s.id);
          await supabase.from('sessions').delete().eq('id', s.id);
          fetchData();
        },
      },
    ]);
  };

  const totalMastery = mastery.length > 0 ? Math.round(mastery.reduce((a, m) => a + m.mastery_level, 0) / mastery.length) : 0;
  const weekCount = sessions.filter((s) => (Date.now() - new Date(s.updated_at).getTime()) / 86400000 <= 7).length;

  return (
    <GlassScreen scroll accent="home">
      <GlassPageHeader
        title="Hub"
        actions={
          <>
            <GlassIconButton icon={UserRound} onPress={() => setShowProfile(true)} accessibilityLabel="Account and settings" accent="home" size={40} />
            <GlassActionPill label="New" icon={Plus} onPress={() => setShowCreate(true)} active accent="home" />
          </>
        }
      />

      <View style={styles.statsRow}>
        <GlassCard style={styles.statCard}>
          <GlassStat value={String(sessions.length)} label="Sessions" accent="home" size="sm" />
        </GlassCard>
        <GlassCard style={styles.statCard}>
          <GlassStat value={`${totalMastery}%`} label="Mastery" accent="vocab" size="sm" />
        </GlassCard>
        <GlassCard style={styles.statCard}>
          <GlassStat value={String(mastery.length)} label="Subjects" accent="field" size="sm" />
        </GlassCard>
        <GlassCard style={styles.statCard}>
          <GlassStat value={String(weekCount)} label="This Week" accent="audio" size="sm" />
        </GlassCard>
      </View>

      <View style={styles.sectionRow}>
        <Icon icon={Rocket} size={16} color={theme.accents.home.solid} />
        <Text style={styles.sectionTitle}>YOUR SESSIONS</Text>
        <View style={styles.filters}>
          {(['all', 'active', 'done'] as Filter[]).map((f) => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              accessibilityRole="button"
              accessibilityState={{ selected: filter === f }}
              style={[styles.chip, filter === f && { backgroundColor: theme.accents.home.solid }]}
            >
              <Text style={[styles.chipLabel, filter === f && { color: '#FFF' }]}>
                {f === 'all' ? 'All' : f === 'active' ? 'Active' : 'Done'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {loading ? (
        <GlassCard>
          <Text style={theme.glassType.body}>Loading your sessions...</Text>
        </GlassCard>
      ) : sessions.length === 0 ? (
        <GlassCard>
          <View style={styles.emptyRow}>
            <Icon icon={BookOpen} size={24} color={theme.light.inkFaint} />
            <View style={styles.emptyText}>
              <Text style={theme.glassType.subtitle}>No sessions yet</Text>
              <Text style={theme.glassType.body}>Tap New to start your first learning path.</Text>
            </View>
          </View>
        </GlassCard>
      ) : filtered.length === 0 ? (
        <GlassCard>
          <Text style={theme.glassType.body}>No {filter === 'active' ? 'active' : 'completed'} sessions.</Text>
        </GlassCard>
      ) : (
        filtered.map((s) => {
          const progress = getMastery(s.title);
          const subjectColor = getSubjectColor(s.title, theme);
          return (
            <GlassCard key={s.id} style={styles.sessionCard}>
              <Pressable onPress={() => resume(s)} accessibilityRole="button" style={styles.sessionBody}>
                <View style={styles.sessionTop}>
                  <View style={[styles.subjectBadge, { backgroundColor: subjectColor }]}>
                    <Icon icon={getSubjectIcon(s.title)} size={15} color="#FFFFFF" strokeWidth={2.1} />
                  </View>
                  <View style={styles.sessionMeta}>
                    <Text style={[styles.sessionStatus, { color: progress >= 100 ? theme.accents.audio.solid : theme.light.inkMuted }]}>
                      {progress >= 100 ? 'DONE' : 'ACTIVE'}
                    </Text>
                    <Text style={styles.sessionTime}>{timeAgo(s.updated_at || s.created_at)}</Text>
                  </View>
                  <Pressable onPress={() => deleteSession(s)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Delete session">
                    <Icon icon={Trash2} size={16} color={theme.light.inkFaint} />
                  </Pressable>
                </View>
                <Text style={styles.sessionTitle} numberOfLines={2}>{s.title}</Text>
                <View style={styles.progressRow}>
                  <Text style={styles.progressLabel}>PROGRESS</Text>
                  <Text style={styles.progressValue}>{progress}%</Text>
                </View>
                <View style={styles.track}>
                  <View style={[styles.trackFill, { width: `${Math.min(progress, 100)}%`, backgroundColor: subjectColor }]} />
                </View>
                <View style={styles.resumeRow}>
                  <Text style={[styles.resumeText, { color: subjectColor }]}>RESUME</Text>
                  <Icon icon={ChartColumn} size={14} color={subjectColor} />
                </View>
              </Pressable>
            </GlassCard>
          );
        })
      )}

      <CreateSessionModal open={showCreate} onClose={() => setShowCreate(false)} />
      <ProfileSheet open={showProfile} onClose={() => setShowProfile(false)} email={authSession?.user.email} />
    </GlassScreen>
  );
}

const makeStyles = (theme: GlassTheme) => StyleSheet.create({
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  statCard: { flex: 1 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  sectionTitle: { ...theme.glassType.overline, color: theme.light.inkMuted },
  filters: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.xs },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: glassRadius.pill,
    backgroundColor: theme.inkEdge(0.05),
  },
  chipLabel: { ...theme.glassType.overline, fontSize: 10, color: theme.light.inkMuted },
  sessionCard: { marginBottom: spacing.md },
  sessionBody: { gap: spacing.sm },
  sessionTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sessionMeta: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sessionStatus: { ...theme.glassType.overline, fontSize: 9 },
  sessionTime: { ...theme.glassType.caption },
  subjectBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
  sessionTitle: { ...theme.glassType.subtitle, fontSize: 16 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { ...theme.glassType.overline, fontSize: 9, color: theme.light.inkFaint },
  progressValue: { ...theme.glassType.label, fontSize: 12 },
  track: { height: 6, borderRadius: 3, backgroundColor: theme.inkEdge(0.08), overflow: 'hidden' },
  trackFill: { height: '100%', borderRadius: 3 },
  resumeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginTop: spacing.xs },
  resumeText: { ...theme.glassType.overline, fontSize: 9, color: theme.accents.home.solid },
  emptyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  emptyText: { flex: 1, gap: 2 },
});
