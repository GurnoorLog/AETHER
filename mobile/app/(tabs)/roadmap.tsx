import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useActiveSession } from '@/lib/activeSession';
import type { RoadmapModule } from '@/lib/types';
import { Icon } from '@/components/glass/Icon';
import { BottomNav } from '@/components/BottomNav';
import { ArrowRight, Check, ChevronDown, Lock, Map } from '@/components/glass/icons';

const GREEN = '#6B8E61';

export default function RoadmapScreen() {
  const { session: authSession } = useAuth();
  const { session } = useActiveSession();
  const [modules, setModules] = useState<RoadmapModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchModules = useCallback(async () => {
    if (!authSession || !session) { setLoading(false); return; }
    const { data } = await supabase
      .from('session_roadmap_modules')
      .select('*')
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

  useEffect(() => { fetchModules(); }, [fetchModules]);

  const completedCount = modules.filter((m) => m.status === 'completed').length;
  const progress = modules.length > 0 ? Math.round((completedCount / modules.length) * 100) : 0;

  const startModule = async (mod: RoadmapModule) => {
    if (!authSession || !session) return;
    const title = `Module ${mod.module_index + 1} — ${mod.title}`;
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('user_id', authSession.user.id)
      .eq('session_id', session.id)
      .eq('title', title)
      .maybeSingle();
    let convId = existing?.id ?? null;
    if (!convId) {
      const { data: created, error } = await supabase
        .from('conversations')
        .insert({ user_id: authSession.user.id, session_id: session.id, title })
        .select('id')
        .single();
      if (created && !error) convId = created.id;
    }
    router.push(convId ? { pathname: '/(tabs)/tutor', params: { conversation: convId } } : '/(tabs)/tutor');
  };

  if (!session) {
    return (
      <View style={styles.root}>
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.greeting}>Learning Roadmap</Text>
          <View style={styles.emptyCard}>
            <Icon icon={Map} size={32} color="#CCC" />
            <Text style={styles.emptyTitle}>No active session</Text>
            <Text style={styles.emptyDesc}>Create a session from the Hub to see your roadmap.</Text>
          </View>
          <View style={{ height: 120 }} />
        </ScrollView>
        <BottomNav />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Icon icon={Map} size={22} color={GREEN} />
          </View>
          <View style={styles.heroText}>
            <Text style={styles.heroLabel}>LEARNING ROADMAP</Text>
            <Text style={styles.heroTitle} numberOfLines={1}>{session.title}</Text>
          </View>
          <View style={styles.heroProgress}>
            <Text style={styles.heroPct}>{progress}%</Text>
            <View style={styles.heroTrack}>
              <View style={[styles.heroTrackFill, { width: `${progress}%` }]} />
            </View>
          </View>
        </View>

        {loading ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyDesc}>Loading your roadmap...</Text>
          </View>
        ) : modules.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyDesc}>No modules yet. Create a session from the Hub.</Text>
          </View>
        ) : (
          <View style={styles.timeline}>
            {modules.map((mod) => {
              const isCompleted = mod.status === 'completed';
              const isCurrent = mod.status === 'current';
              const isExpanded = expandedId === mod.id;
              const lessons = Array.isArray(mod.lessons) ? mod.lessons : [];
              const keyConcepts = (mod.key_concepts || '').split(',').map((c) => c.trim()).filter(Boolean);

              return (
                <View key={mod.id} style={styles.timelineItem}>
                  <View style={styles.dotColumn}>
                    <View style={[styles.dot, isCompleted ? styles.dotDone : isCurrent ? styles.dotCurrent : styles.dotLocked]}>
                      {isCompleted ? <Icon icon={Check} size={14} color="#FFF" strokeWidth={3} /> : isCurrent ? null : <Icon icon={Lock} size={13} color="#CCC" />}
                    </View>
                    <View style={styles.line} />
                  </View>

                  <Pressable
                    style={[styles.moduleCard, (isCompleted || !isCurrent) && !isExpanded && styles.moduleDim]}
                    onPress={() => startModule(mod)}
                  >
                    {isCompleted ? (
                      <>
                        <Text style={styles.moduleTitle}>{mod.title}</Text>
                        <Text style={styles.moduleMeta}>Successfully mastered</Text>
                        {mod.completed_at ? <Text style={styles.moduleDate}>Completed {new Date(mod.completed_at).toLocaleDateString()}</Text> : null}
                      </>
                    ) : (
                      <>
                        <View style={styles.moduleTop}>
                          <Text style={[styles.moduleTitle, isCurrent && { color: GREEN }]} numberOfLines={2}>{mod.title}</Text>
                          {isCurrent ? <View style={styles.currentPill}><Text style={styles.currentPillText}>CURRENT</Text></View> : null}
                        </View>
                        {mod.description ? <Text style={styles.moduleDesc}>{mod.description}</Text> : null}

                        {isCurrent && lessons.length > 0 ? (
                          <Pressable onPress={() => setExpandedId(isExpanded ? null : mod.id)} style={styles.detailsToggle}>
                            <Text style={styles.detailsToggleText}>{isExpanded ? 'Hide Details' : 'More Details'}</Text>
                            <Icon icon={ChevronDown} size={14} color={GREEN} />
                          </Pressable>
                        ) : null}

                        {isCurrent && isExpanded ? (
                          <View style={styles.expanded}>
                            {mod.learning_objectives ? (
                              <View>
                                <Text style={styles.expandedLabel}>LEARNING OBJECTIVES</Text>
                                <Text style={styles.expandedText}>{mod.learning_objectives}</Text>
                              </View>
                            ) : null}
                            {keyConcepts.length > 0 ? (
                              <View>
                                <Text style={styles.expandedLabel}>KEY CONCEPTS</Text>
                                <View style={styles.chips}>
                                  {keyConcepts.map((concept, i) => (
                                    <View key={i} style={styles.chip}><Text style={styles.chipText}>{concept}</Text></View>
                                  ))}
                                </View>
                              </View>
                            ) : null}
                            {lessons.length > 0 ? (
                              <View>
                                <Text style={styles.expandedLabel}>LESSONS</Text>
                                {lessons.map((lesson, li) => (
                                  <View key={li} style={styles.lesson}>
                                    <View style={styles.lessonTop}>
                                      <Text style={styles.lessonTitle} numberOfLines={1}>{lesson.title}</Text>
                                      <Text style={styles.lessonDuration}>{lesson.duration_minutes}m</Text>
                                    </View>
                                    {lesson.description ? <Text style={styles.lessonDesc}>{lesson.description}</Text> : null}
                                  </View>
                                ))}
                              </View>
                            ) : null}
                            <Pressable onPress={() => startModule(mod)} style={styles.startBtn}>
                              <Text style={styles.startBtnText}>START MODULE</Text>
                              <Icon icon={ArrowRight} size={15} color="#FFF" strokeWidth={2.2} />
                            </Pressable>
                          </View>
                        ) : null}
                      </>
                    )}
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}
        <View style={{ height: 120 }} />
      </ScrollView>
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FDFBF7' },
  scroll: { flex: 1, paddingHorizontal: 24, paddingTop: 60 },
  greeting: { fontSize: 28, fontWeight: '700', color: '#333', marginBottom: 20 },

  // Hero
  heroCard: { backgroundColor: '#FFF', borderRadius: 32, borderWidth: 1, borderColor: '#F3EDE3', padding: 20, marginBottom: 28, flexDirection: 'row', alignItems: 'center', gap: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 4 },
  heroIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E8F0E5', alignItems: 'center', justifyContent: 'center' },
  heroText: { flex: 1, gap: 2 },
  heroLabel: { fontSize: 10, fontWeight: '700', color: GREEN, textTransform: 'uppercase', letterSpacing: 0.5 },
  heroTitle: { fontSize: 17, fontWeight: '700', color: '#333' },
  heroProgress: { alignItems: 'flex-end', gap: 4 },
  heroPct: { fontSize: 16, fontWeight: '700', color: '#333' },
  heroTrack: { width: 52, height: 5, borderRadius: 3, backgroundColor: '#F3EDE3', overflow: 'hidden' },
  heroTrackFill: { height: '100%', borderRadius: 3, backgroundColor: GREEN },

  // Timeline
  timeline: { gap: 0 },
  timelineItem: { flexDirection: 'row', gap: 14 },
  dotColumn: { alignItems: 'center', width: 34 },
  dot: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  dotDone: { backgroundColor: GREEN, borderWidth: 3, borderColor: '#FDFBF7' },
  dotCurrent: { backgroundColor: '#E8F0E5', borderWidth: 3, borderColor: '#FDFBF7' },
  dotLocked: { backgroundColor: '#F3EDE3' },
  line: { flex: 1, width: 2, backgroundColor: '#F3EDE3', marginVertical: 4 },

  // Module card
  moduleCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 20, borderWidth: 1, borderColor: '#F3EDE3', padding: 16, marginBottom: 14, gap: 8 },
  moduleDim: { opacity: 0.5 },
  moduleTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  moduleTitle: { fontSize: 15, fontWeight: '700', color: '#333', flexShrink: 1 },
  moduleMeta: { fontSize: 12, color: '#999' },
  moduleDate: { fontSize: 12, color: GREEN },
  moduleDesc: { fontSize: 14, color: '#999', lineHeight: 20 },
  currentPill: { backgroundColor: '#E8F0E5', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  currentPillText: { fontSize: 10, fontWeight: '700', color: GREEN },
  detailsToggle: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
  detailsToggleText: { fontSize: 12, fontWeight: '600', color: GREEN },

  // Expanded
  expanded: { gap: 12, marginTop: 6, borderTopWidth: 1, borderTopColor: '#F3EDE3', paddingTop: 12 },
  expandedLabel: { fontSize: 10, fontWeight: '700', color: '#BBB', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  expandedText: { fontSize: 14, lineHeight: 20, color: '#666' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { backgroundColor: '#F3EDE3', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
  chipText: { fontSize: 11, color: '#666' },
  lessons: { gap: 8 },
  lesson: { backgroundColor: '#F9F6F0', borderRadius: 16, padding: 14, gap: 4 },
  lessonTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  lessonTitle: { fontSize: 13, fontWeight: '600', color: '#333', flex: 1 },
  lessonDuration: { fontSize: 10, color: '#CCC' },
  lessonDesc: { fontSize: 12, color: '#999' },
  startBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: GREEN, borderRadius: 20, paddingVertical: 14, marginTop: 6 },
  startBtnText: { fontSize: 12, fontWeight: '700', color: '#FFF' },

  // Empty
  emptyCard: { backgroundColor: '#FFF', borderRadius: 24, borderWidth: 1, borderColor: '#F3EDE3', padding: 32, alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginTop: 12 },
  emptyDesc: { fontSize: 14, color: '#999', textAlign: 'center', lineHeight: 20, marginTop: 6 },
});
