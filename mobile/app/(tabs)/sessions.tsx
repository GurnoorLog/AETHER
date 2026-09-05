import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { AetherSession } from '@/lib/types';
import { useActiveSession } from '@/lib/activeSession';
import { Icon } from '@/components/glass/Icon';
import { BookOpen, Rocket } from '@/components/glass/icons';
import { BottomNav } from '@/components/BottomNav';
import { EditorialPressable, Stamp, Kicker, EditorialPageHeader, SERIF, EDITORIAL } from '@/components/editorial';

const GREEN = '#3F5C3A';

type Filter = 'all' | 'active' | 'done';

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function SessionsTab() {
  const { session: authSession } = useAuth();
  const { setSession } = useActiveSession();
  const [sessions, setSessions] = useState<AetherSession[]>([]);
  const [mastery, setMastery] = useState<{ subject: string; mastery_level: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');

  const fetchData = useCallback(async () => {
    if (!authSession) return;
    const [sessionsRes, masteryRes] = await Promise.all([
      supabase.from('sessions')
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

  const getMastery = (title: string) => {
    const subject = title.match(/^(.+?) Study Session$/) ? title.match(/^(.+?) Study Session$/)![1] : title;
    const found = mastery.find((m) => m.subject === subject);
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
    router.push('/(tabs)');
  };

  return (
    <View style={styles.root}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <EditorialPageHeader kicker="Your study shelf" title="Sessions" subtitle="Your learning sessions" />

        <View style={styles.tabs}>
          {(['all', 'active', 'done'] as Filter[]).map((f) => (
            <EditorialPressable
              key={f}
              onPress={() => setFilter(f)}
              pressShadow="1px 1px 0 0 #2D3436"
              accessibilityRole="button"
              accessibilityState={{ selected: filter === f }}
              style={[styles.tab, filter === f && styles.tabActive]}
            >
              <Text style={[styles.tabText, filter === f && styles.tabTextActive]}>
                {f === 'all' ? 'All' : f === 'active' ? 'Active' : 'Done'}
              </Text>
            </EditorialPressable>
          ))}
        </View>

        {loading ? (
          <Text style={styles.emptyText}>Loading...</Text>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Icon icon={BookOpen} size={40} color={EDITORIAL.inkMuted} />
            </View>
            <Text style={styles.emptyTitle}>No sessions found</Text>
            <Text style={styles.emptyDesc}>Create a session from the Hub to get started.</Text>
          </View>
        ) : (
          filtered.map((s) => {
            const progress = getMastery(s.title);
            return (
              <Pressable key={s.id} style={styles.card} onPress={() => resume(s)}>
                <View style={styles.cardTop}>
                  <View style={styles.cardTitleRow}>
                    <Icon icon={Rocket} size={16} color={GREEN} />
                    <Text style={styles.cardTitle} numberOfLines={1}>{s.title}</Text>
                  </View>
                  {progress >= 100 ? (
                    <Stamp tone="forest" rotate={-2}>Done</Stamp>
                  ) : (
                    <Stamp tone="ink" rotate={1.5} style={{ opacity: 0.7 }}>Active</Stamp>
                  )}
                </View>
                <Text style={styles.time}>{timeAgo(s.updated_at || s.created_at)}</Text>
                <View style={styles.track}>
                  <View style={[styles.trackFill, { width: `${Math.min(progress, 100)}%` }]} />
                </View>
              </Pressable>
            );
          })
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: EDITORIAL.cream },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  title: { fontFamily: SERIF, fontSize: 30, fontWeight: '700', color: EDITORIAL.ink, letterSpacing: 0.2 },
  subtitle: { fontSize: 15, color: EDITORIAL.inkMuted, marginTop: 4, marginBottom: 24 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  tab: {
    height: 36,
    paddingHorizontal: 24,
    borderRadius: 255,
    borderTopLeftRadius: 255,
    borderTopRightRadius: 15,
    borderBottomLeftRadius: 225,
    borderBottomRightRadius: 15,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: EDITORIAL.cream,
    borderColor: EDITORIAL.ink,
    boxShadow: '2px 2px 0 0 #2D3436',
  },
  tabText: { fontFamily: SERIF, fontSize: 14, fontWeight: '500', color: EDITORIAL.inkMuted },
  tabTextActive: { fontFamily: SERIF, fontSize: 14, fontWeight: '700', color: GREEN },
  card: {
    backgroundColor: EDITORIAL.cream,
    borderRadius: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 7,
    borderWidth: 2,
    borderColor: EDITORIAL.ink,
    padding: 16,
    marginBottom: 12,
    boxShadow: '4px 4px 0 0 #2D3436',
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, marginRight: 8 },
  cardTitle: { fontFamily: SERIF, fontSize: 14, fontWeight: '700', color: EDITORIAL.ink, flex: 1 },
  time: { fontFamily: SERIF, fontSize: 12, color: EDITORIAL.inkMuted, marginBottom: 10 },
  track: { height: 6, borderRadius: 3, backgroundColor: '#EFEAE0', overflow: 'hidden' },
  trackFill: { height: '100%', borderRadius: 3, backgroundColor: GREEN },
  emptyCard: {
    backgroundColor: EDITORIAL.cream,
    borderRadius: 22,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 7,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 8,
    borderWidth: 2,
    borderColor: EDITORIAL.ink,
    padding: 32,
    alignItems: 'center',
    boxShadow: '4px 4px 0 0 #2D3436',
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3EDE3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontFamily: SERIF, fontSize: 16, fontWeight: '700', color: EDITORIAL.ink, marginTop: 12, marginBottom: 8 },
  emptyDesc: { fontFamily: SERIF, fontSize: 14, color: EDITORIAL.inkMuted, textAlign: 'center', lineHeight: 20 },
  emptyText: { fontFamily: SERIF, fontSize: 14, color: EDITORIAL.inkMuted, textAlign: 'center', marginTop: 40 },
});
