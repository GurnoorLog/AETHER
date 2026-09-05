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
import { EditorialPressable, Stamp, Kicker, EditorialPageHeader, SERIF, EDITORIAL } from '@/components/editorial';

const GREEN = '#3F5C3A';

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
    const title = `Module ${mod.module_index + 1} â€” ${mod.title}`;
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
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.greeting}>Learning Roadmap</Text>
          <View style={styles.emptyCard}>
            <Icon icon={Map} size={32} color="#8A8478" />
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
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Icon icon={Map} size={22} color={GREEN} />
          </View>
          <View style={styles.heroText}>
            <Kicker style={{ marginBottom: 4 }}>Learning roadmap</Kicker>
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
                      {isCompleted ? <Icon icon={Check} size={14} color="#FDFBF7" strokeWidth={3} /> : isCurrent ? null : <Icon icon={Lock} size={13} color="#8A8478" />}
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
                          {isCurrent ? <Stamp tone="forest" rotate={2}>Current</Stamp> : null}
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
                            <EditorialPressable onPress={() => startModule(mod)} pressShadow="1px 1px 0 0 #2D3436" accessibilityRole="button" style={styles.startBtn}>
                              <Text style={styles.startBtnText}>START MODULE</Text>
                              <Icon icon={ArrowRight} size={15} color="#FDFBF7" strokeWidth={2.2} />
                            </EditorialPressable>
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
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  greeting: { fontFamily: SERIF, fontSize: 28, fontWeight: '700', color: '#2D3436', marginBottom: 20 },

  heroCard: {
    backgroundColor: 'rgba(253,251,247,0.96)',
    borderRadius: 20, borderTopLeftRadius: 20, borderTopRightRadius: 8, borderBottomLeftRadius: 22, borderBottomRightRadius: 7,
    borderWidth: 2, borderColor: '#2D3436',
    padding: 20, marginBottom: 28, flexDirection: 'row', alignItems: 'center', gap: 14,
    boxShadow: '4px 4px 0 0 #2D3436',
  },
  heroIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#E8F0E5', alignItems: 'center', justifyContent: 'center' },
  heroText: { flex: 1, gap: 2 },
  heroLabel: { fontFamily: SERIF, fontSize: 10, fontWeight: '700', color: GREEN, textTransform: 'uppercase', letterSpacing: 0.5 },
  heroTitle: { fontFamily: SERIF, fontSize: 19, fontWeight: '700', color: '#2D3436' },
  heroProgress: { alignItems: 'flex-end', gap: 4 },
  heroPct: { fontFamily: SERIF, fontSize: 16, fontWeight: '700', color: '#2D3436' },
  heroTrack: { width: 52, height: 5, borderRadius: 3, backgroundColor: '#EFEAE0', overflow: 'hidden' },
  heroTrackFill: { height: '100%', borderRadius: 3, backgroundColor: GREEN },

  timeline: { gap: 0 },
  timelineItem: { flexDirection: 'row', gap: 14 },
  dotColumn: { alignItems: 'center', width: 34 },
  dot: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  dotDone: { backgroundColor: GREEN, borderWidth: 3, borderColor: '#FDFBF7' },
  dotCurrent: { backgroundColor: '#E8F0E5', borderWidth: 3, borderColor: '#FDFBF7' },
  dotLocked: { backgroundColor: '#EFEAE0' },
  line: { flex: 1, width: 2, backgroundColor: '#EFEAE0', marginVertical: 4 },

  moduleCard: {
    flex: 1, backgroundColor: '#FDFBF7',
    borderRadius: 20, borderTopLeftRadius: 20, borderTopRightRadius: 8, borderBottomLeftRadius: 22, borderBottomRightRadius: 7,
    borderWidth: 2, borderColor: '#2D3436', padding: 16, marginBottom: 14, gap: 8,
    boxShadow: '3px 3px 0 0 #2D3436',
  },
  moduleDim: { opacity: 0.5 },
  moduleTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  moduleTitle: { fontFamily: SERIF, fontSize: 15, fontWeight: '700', color: '#2D3436', flexShrink: 1 },
  moduleMeta: { fontFamily: SERIF, fontSize: 12, color: '#8A8478' },
  moduleDate: { fontFamily: SERIF, fontSize: 12, color: GREEN },
  moduleDesc: { fontFamily: SERIF, fontSize: 14, color: '#555E61', lineHeight: 20 },
  detailsToggle: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
  detailsToggleText: { fontFamily: SERIF, fontSize: 12, fontWeight: '600', color: GREEN },

  expanded: { gap: 12, marginTop: 6, borderTopWidth: 1, borderTopColor: '#EFEAE0', paddingTop: 12 },
  expandedLabel: { fontFamily: SERIF, fontSize: 10, fontWeight: '600', color: '#555E61', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4 },
  expandedText: { fontFamily: SERIF, fontSize: 14, lineHeight: 20, color: '#555E61' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    backgroundColor: '#FDFBF7', borderWidth: 1.5, borderColor: '#3F5C3A',
    borderRadius: 6, borderTopLeftRadius: 6, borderTopRightRadius: 3, borderBottomLeftRadius: 7, borderBottomRightRadius: 2,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  chipText: { fontFamily: SERIF, fontSize: 11, color: '#3F5C3A' },
  lessons: { gap: 8 },
  lesson: {
    backgroundColor: '#FDFBF7', borderWidth: 1.5, borderColor: '#EFEAE0',
    borderRadius: 16, borderTopLeftRadius: 16, borderTopRightRadius: 6, borderBottomLeftRadius: 18, borderBottomRightRadius: 6,
    padding: 14, gap: 4,
  },
  lessonTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  lessonTitle: { fontFamily: SERIF, fontSize: 13, fontWeight: '600', color: '#2D3436', flex: 1 },
  lessonDuration: { fontFamily: SERIF, fontSize: 10, color: '#8A8478' },
  lessonDesc: { fontFamily: SERIF, fontSize: 12, color: '#8A8478' },
  startBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: GREEN, borderWidth: 2, borderColor: '#2D3436',
    borderRadius: 255, borderTopLeftRadius: 255, borderTopRightRadius: 15, borderBottomLeftRadius: 225, borderBottomRightRadius: 15,
    paddingVertical: 14, marginTop: 6,
    boxShadow: '3px 3px 0 0 #2D3436',
  },
  startBtnText: { fontFamily: SERIF, fontSize: 12, fontWeight: '700', color: '#FDFBF7', textTransform: 'uppercase', letterSpacing: 0.3 },

  emptyCard: {
    backgroundColor: '#FDFBF7',
    borderRadius: 22, borderTopLeftRadius: 22, borderTopRightRadius: 7, borderBottomLeftRadius: 24, borderBottomRightRadius: 8,
    borderWidth: 2, borderColor: '#2D3436', padding: 32, alignItems: 'center',
    boxShadow: '3px 3px 0 0 #2D3436',
  },
  emptyTitle: { fontFamily: SERIF, fontSize: 16, fontWeight: '700', color: '#2D3436', marginTop: 12 },
  emptyDesc: { fontFamily: SERIF, fontSize: 14, color: '#555E61', textAlign: 'center', lineHeight: 20, marginTop: 6 },
});