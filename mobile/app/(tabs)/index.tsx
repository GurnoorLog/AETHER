import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Image, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { AetherSession } from '@/lib/types';
import { useActiveSession } from '@/lib/activeSession';
import { mixHex } from '@/lib/color';
import { useTheme, type GlassTheme } from '@/theme';
import { CreateSessionModal } from '@/components/CreateSessionModal';
import { ProfileSheet } from '@/components/ProfileSheet';
import { Icon, type IconComponent } from '@/components/glass/Icon';
import {
  Atom,
  BookOpen,
  Brain,
  Calculator,
  ChartColumn,
  CalendarDays,
  Code,
  Dna,
  FileText,
  ArrowUpRight,
  Languages,
  Leaf,
  Pill,
  Plus,
  ScrollText,
  Target,
  Sparkles,
  Trash2,
  TrendingUp,
  Wrench,
} from '@/components/glass/icons';
import { BottomNav } from '@/components/BottomNav';

const BG_IMAGE = require('../../assets/design/hub_scene.jpeg');
const HUB_ICON = require('../../assets/design/hub_icon.png');

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

const GREEN = '#6B8E61';

const STAT_CONFIG = [
  { bg: '#F0EEFA', iconColor: '#7C69A2', valueColor: '#7C69A2', icon: FileText },
  { bg: '#FFF5E6', iconColor: '#EAB308', valueColor: '#EAB308', icon: Target },
  { bg: '#EBF1FF', iconColor: '#6366F1', valueColor: '#6366F1', icon: BookOpen },
  { bg: '#EBF7F2', iconColor: GREEN, valueColor: GREEN, icon: CalendarDays },
];

function getSubject(title: string): string {
  return title.match(/^(.+?) Study Session$/) ? title.match(/^(.+?) Study Session$/)![1] : title;
}

function getSubjectIcon(title: string): IconComponent {
  return SUBJECT_ICON[getSubject(title)] || BookOpen;
}

function getSubjectColor(title: string, theme: GlassTheme): string {
  const c = SUBJECT_COLOR[getSubject(title)] || GREEN;
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

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
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
  const [profileName, setProfileName] = useState('');

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

  useEffect(() => { fetchData(); }, [fetchData]);

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

  const displayName = profileName || authSession?.user.email?.split('@')[0] || 'there';

  const stats = [
    { value: String(sessions.length), label: 'Sessions', ...STAT_CONFIG[0] },
    { value: `${totalMastery}%`, label: 'Mastery', ...STAT_CONFIG[1] },
    { value: String(mastery.length), label: 'Subjects', ...STAT_CONFIG[2] },
    { value: String(weekCount), label: 'This week', ...STAT_CONFIG[3] },
  ];

  return (
    <View style={styles.root}>
      <ImageBackground source={BG_IMAGE} style={styles.bgImage} resizeMode="cover" />

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Greeting */}
        <View style={styles.greetingArea}>
          <Text style={styles.greeting}>{getGreeting()},{'\n'}<Text style={styles.greetingName}>{displayName}</Text></Text>
          <Text style={styles.greetingSub}>Ready to learn something amazing today?</Text>
          <View style={styles.avatar}>
            <Image source={BG_IMAGE} style={styles.avatarImg} resizeMode="cover" />
          </View>
        </View>

        {/* Floating New button */}
        <View style={styles.floatingArea}>
          <Pressable style={styles.newButton} onPress={() => setShowCreate(true)}>
            <Icon icon={Plus} size={18} color="#FFF" strokeWidth={2.5} />
            <Text style={styles.newButtonText}>New</Text>
          </Pressable>
        </View>

        {/* White card */}
        <View style={styles.whiteCard}>
          {/* Stats grid */}
          <View style={styles.statsGrid}>
            {stats.map((stat, i) => (
              <View key={i} style={styles.statCard}>
                <View style={[styles.statIconWrap, { backgroundColor: stat.bg }]}>
                  <Icon icon={stat.icon} size={20} color={stat.iconColor} />
                </View>
                <Text style={[styles.statValue, { color: stat.valueColor }]}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Your Sessions header */}
          <View style={styles.sessionsHeader}>
            <View style={styles.sessionsTitleRow}>
              <Icon icon={Leaf} size={20} color={GREEN} />
              <Text style={styles.sessionsTitle}>Your Sessions</Text>
            </View>
            <Pressable style={styles.calendarLink}>
              <Icon icon={CalendarDays} size={16} color={GREEN} />
              <Text style={styles.calendarLinkText}>View calendar</Text>
            </Pressable>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            {(['all', 'active', 'done'] as Filter[]).map((f) => (
              <Pressable
                key={f}
                onPress={() => setFilter(f)}
                style={[styles.tab, filter === f && styles.tabActive]}
              >
                <Text style={[styles.tabText, filter === f && styles.tabTextActive]}>
                  {f === 'all' ? 'All' : f === 'active' ? 'Active' : 'Done'}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Sessions list or empty */}
          {loading ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyDesc}>Loading your sessions...</Text>
            </View>
          ) : sessions.length === 0 || filtered.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIllustration}>
                <View style={styles.emptyCircle}>
                  <Image source={HUB_ICON} style={styles.emptyIcon} resizeMode="contain" />
                </View>
                <View style={styles.sparkle1}>
                  <Icon icon={Sparkles} size={18} color="#FAD59B" />
                </View>
                <View style={styles.sparkle2}>
                  <Icon icon={Sparkles} size={14} color="#FAD59B" />
                </View>
                <View style={styles.sparkle3}>
                  <Icon icon={Sparkles} size={14} color="#FAD59B" />
                </View>
              </View>
              <Text style={styles.emptyTitle}>No sessions yet</Text>
              <Text style={styles.emptyDesc}>Tap New to start your first learning session and I'll build a personalized path just for you.</Text>
              <Pressable style={styles.createButton} onPress={() => setShowCreate(true)}>
                <Icon icon={Plus} size={18} color="#FFF" strokeWidth={2} />
                <Text style={styles.createButtonText}>Create your first session</Text>
              </Pressable>
              <View style={styles.arrowIndicator}>
                <Icon icon={ArrowUpRight} size={24} color={GREEN} />
              </View>
            </View>
          ) : (
            filtered.map((s) => {
              const progress = getMastery(s.title);
              const subjectColor = getSubjectColor(s.title, theme);
              return (
                <Pressable key={s.id} onPress={() => resume(s)} style={styles.sessionCard}>
                  <View style={styles.sessionTop}>
                    <View style={[styles.subjectBadge, { backgroundColor: subjectColor }]}>
                      <Icon icon={getSubjectIcon(s.title)} size={15} color="#FFF" strokeWidth={2.1} />
                    </View>
                    <View style={[styles.sessionBadge, { backgroundColor: progress >= 100 ? 'rgba(34,197,94,0.1)' : 'rgba(0,0,0,0.04)' }]}>
                      <Text style={[styles.sessionBadgeText, { color: progress >= 100 ? '#22c55e' : '#999' }]}>
                        {progress >= 100 ? 'Done' : 'Active'}
                      </Text>
                    </View>
                    <Pressable onPress={() => deleteSession(s)} hitSlop={8} style={styles.deleteBtn}>
                      <Icon icon={Trash2} size={14} color="#CCC" />
                    </Pressable>
                  </View>
                  <Text style={styles.sessionTitle} numberOfLines={1}>{s.title}</Text>
                  <Text style={styles.sessionTime}>{timeAgo(s.updated_at || s.created_at)}</Text>
                  <View style={styles.progressRow}>
                    <Text style={styles.progressLabel}>PROGRESS</Text>
                    <Text style={styles.progressValue}>{progress}%</Text>
                  </View>
                  <View style={styles.track}>
                    <View style={[styles.trackFill, { width: `${Math.min(progress, 100)}%`, backgroundColor: subjectColor }]} />
                  </View>
                  <View style={styles.resumeRow}>
                    <Text style={[styles.resumeText, { color: subjectColor }]}>Resume →</Text>
                  </View>
                </Pressable>
              );
            })
          )}
        </View>

        <View style={{ height: 100, backgroundColor: '#FFF' }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNav />

      <CreateSessionModal open={showCreate} onClose={() => setShowCreate(false)} />
      <ProfileSheet open={showProfile} onClose={() => setShowProfile(false)} email={authSession?.user.email} />
    </View>
  );
}

const makeStyles = (_theme: GlassTheme) => StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FDFBF7' },
  bgImage: { position: 'absolute', top: 0, left: 0, right: 0, height: 420 },
  scrollContent: { flex: 1 },

  // Greeting
  greetingArea: { paddingHorizontal: 24, paddingTop: 56, position: 'relative' },
  greeting: { fontSize: 28, fontWeight: '700', color: '#333', lineHeight: 34, fontFamily: 'Outfit_700Bold' },
  greetingName: { color: GREEN },
  greetingSub: { fontSize: 15, color: '#666', marginTop: 4, opacity: 0.8 },
  avatar: { position: 'absolute', top: 52, right: 24, width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: '#FFF', overflow: 'hidden', backgroundColor: '#F9F6F0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  avatarImg: { width: '100%', height: '100%' },

  // Floating
  floatingArea: { height: 120, paddingHorizontal: 24, position: 'relative', alignItems: 'flex-end' },
  newButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: GREEN, paddingHorizontal: 16, height: 40, borderRadius: 12, shadowColor: GREEN, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  newButtonText: { color: '#FFF', fontWeight: '700', fontSize: 15 },

  // White card
  whiteCard: { backgroundColor: '#FFF', borderTopLeftRadius: 40, borderTopRightRadius: 40, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 24, marginTop: 64, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.04, shadowRadius: 20, elevation: 8 },

  // Stats
  statsGrid: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 20, borderWidth: 1.5, borderColor: '#FDFBF7', padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 6, elevation: 2 },
  statIconWrap: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statValue: { fontSize: 22, fontWeight: '700', lineHeight: 26 },
  statLabel: { fontSize: 11, fontWeight: '500', color: '#999', marginTop: 4 },

  // Sessions header
  sessionsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 36, marginBottom: 16 },
  sessionsTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sessionsTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
  calendarLink: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  calendarLinkText: { fontSize: 13, fontWeight: '700', color: GREEN },

  // Tabs
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  tab: { height: 36, paddingHorizontal: 24, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  tabActive: { backgroundColor: '#F3EDE3' },
  tabText: { fontSize: 14, fontWeight: '500', color: '#999' },
  tabTextActive: { fontSize: 14, fontWeight: '700', color: GREEN },

  // Empty state
  emptyCard: { backgroundColor: '#FFF', borderRadius: 32, borderWidth: 1, borderColor: '#F3EDE3', padding: 32, alignItems: 'center' },
  emptyIllustration: { marginBottom: 24, alignItems: 'center', position: 'relative' },
  emptyCircle: { width: 150, height: 150, borderRadius: 75, backgroundColor: '#F9F6F0', alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { width: 120, height: 120 },
  sparkle1: { position: 'absolute', top: 4, right: 16 },
  sparkle2: { position: 'absolute', top: 40, left: 16 },
  sparkle3: { position: 'absolute', bottom: 20, right: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20, opacity: 0.8, marginBottom: 32, maxWidth: 260 },
  createButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: GREEN, width: '100%', height: 58, borderRadius: 29, justifyContent: 'center', shadowColor: GREEN, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 6 },
  createButtonText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  arrowIndicator: { position: 'absolute', bottom: 80, right: -4, transform: [{ rotate: '15deg' }], opacity: 0.4 },

  // Session cards
  sessionCard: { backgroundColor: '#FFF', borderRadius: 24, borderWidth: 1, borderColor: '#F3EDE3', padding: 16, marginBottom: 12 },
  sessionTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  subjectBadge: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  sessionBadge: { paddingHorizontal: 10, paddingVertical: 2, borderRadius: 12 },
  sessionBadgeText: { fontSize: 8, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  deleteBtn: { marginLeft: 'auto' },
  sessionTitle: { fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 2 },
  sessionTime: { fontSize: 11, color: '#999', marginBottom: 10 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  progressLabel: { fontSize: 10, fontWeight: '500', color: '#BBB', textTransform: 'uppercase', letterSpacing: 0.5 },
  progressValue: { fontSize: 10, fontWeight: '700', color: '#999' },
  track: { height: 6, borderRadius: 3, backgroundColor: '#F3EDE3', overflow: 'hidden' },
  trackFill: { height: '100%', borderRadius: 3 },
  resumeRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F3EDE3' },
  resumeText: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, opacity: 0.5 },

});
