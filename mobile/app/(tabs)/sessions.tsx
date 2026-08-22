import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { AetherSession } from '@/lib/types';
import { useActiveSession } from '@/lib/activeSession';
import { Icon } from '@/components/glass/Icon';
import { BookOpen, Sparkles, Rocket } from '@/components/glass/icons';
import { BottomNav } from '@/components/BottomNav';

const GREEN = '#6B8E61';

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
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Sessions</Text>
        <Text style={styles.subtitle}>Your learning sessions</Text>

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

        {loading ? (
          <Text style={styles.emptyText}>Loading...</Text>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Icon icon={BookOpen} size={40} color="#CCC" />
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
                  <View style={[styles.badge, { backgroundColor: progress >= 100 ? 'rgba(34,197,94,0.1)' : 'rgba(0,0,0,0.04)' }]}>
                    <Text style={[styles.badgeText, { color: progress >= 100 ? '#22c55e' : '#999' }]}>
                      {progress >= 100 ? 'Done' : 'Active'}
                    </Text>
                  </View>
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
  root: { flex: 1, backgroundColor: '#FDFBF7' },
  scrollContent: { flex: 1, paddingHorizontal: 24, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: '700', color: '#333', fontFamily: 'Outfit_700Bold' },
  subtitle: { fontSize: 15, color: '#666', marginTop: 4, opacity: 0.8, marginBottom: 24 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  tab: { height: 36, paddingHorizontal: 24, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  tabActive: { backgroundColor: '#F3EDE3' },
  tabText: { fontSize: 14, fontWeight: '500', color: '#999' },
  tabTextActive: { fontSize: 14, fontWeight: '700', color: GREEN },
  card: { backgroundColor: '#FFF', borderRadius: 20, borderWidth: 1, borderColor: '#F3EDE3', padding: 16, marginBottom: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, marginRight: 8 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#333', flex: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 2, borderRadius: 12 },
  badgeText: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  time: { fontSize: 12, color: '#999', marginBottom: 10 },
  track: { height: 4, borderRadius: 2, backgroundColor: '#F3EDE3', overflow: 'hidden' },
  trackFill: { height: '100%', borderRadius: 2, backgroundColor: GREEN },
  emptyCard: { backgroundColor: '#FFF', borderRadius: 32, borderWidth: 1, borderColor: '#F3EDE3', padding: 32, alignItems: 'center' },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F9F6F0', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: '#666', textAlign: 'center', opacity: 0.8 },
  emptyText: { fontSize: 14, color: '#999', textAlign: 'center', marginTop: 40 },
});
