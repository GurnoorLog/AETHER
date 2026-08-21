import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useActiveSession } from '@/lib/activeSession';
import type { RoadmapModule } from '@/lib/types';
import { glassRadius, spacing, useTheme, type GlassTheme } from '@/theme';
import { GlassCard } from '@/components/glass/GlassCard';
import { GlassScreen } from '@/components/glass/GlassScreen';
import { Icon } from '@/components/glass/Icon';
import { ArrowRight, Check, ChevronDown, Lock, Map } from '@/components/glass/icons';

export default function RoadmapScreen() {
  const { session: authSession } = useAuth();
  const { session } = useActiveSession();
  const [modules, setModules] = useState<RoadmapModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const fetchModules = useCallback(async () => {
    if (!authSession || !session) {
      setLoading(false);
      return;
    }
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

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

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

  return (
    <GlassScreen scroll accent="home">
      {/* Gradient hero */}
      <View style={styles.hero}>
        <LinearGradient
          colors={theme.accents.home.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroFill}
        />
        <View style={styles.heroIcon}>
          <Icon icon={Map} size={20} color="#8E77E6" strokeWidth={2} />
        </View>
        <View style={styles.heroText}>
          <Text style={styles.heroEyebrow}>LEARNING ROADMAP</Text>
          <Text style={styles.heroTitle} numberOfLines={1}>
            {session?.title || 'Your Session'}
          </Text>
        </View>
        <View style={styles.heroProgress}>
          <Text style={styles.heroPct}>{progress}%</Text>
          <View style={styles.heroTrack}>
            <View style={[styles.heroTrackFill, { width: `${progress}%` }]} />
          </View>
        </View>
      </View>

      {loading ? (
        <GlassCard>
          <Text style={theme.glassType.body}>Loading your roadmap...</Text>
        </GlassCard>
      ) : modules.length === 0 ? (
        <GlassCard>
          <Text style={theme.glassType.body}>No roadmap modules yet. Create a session from the Hub to generate one.</Text>
        </GlassCard>
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
                  <View
                    style={[
                      styles.dot,
                      isCompleted
                        ? { backgroundColor: theme.accents.audio.solid, borderColor: theme.light.base, borderWidth: 3 }
                        : isCurrent
                          ? { backgroundColor: theme.accents.home.solid, borderColor: theme.light.base, borderWidth: 3 }
                          : { backgroundColor: theme.inkEdge(0.12) },
                    ]}
                  >
                    {isCompleted ? <Icon icon={Check} size={14} color="#FFF" strokeWidth={3} /> : isCurrent ? null : <Icon icon={Lock} size={13} color={theme.light.inkFaint} />}
                  </View>
                  <View style={styles.line} />
                </View>

                <GlassCard style={[styles.moduleCard, (isCompleted || !isCurrent) && !isExpanded ? styles.moduleDim : null]}>
                  <Pressable
                    onPress={() => startModule(mod)}
                    accessibilityRole="button"
                    accessibilityLabel={`Open chat for ${mod.title}`}
                    style={({ pressed }) => [styles.moduleBody, pressed && { opacity: 0.85 }]}
                  >
                  {isCompleted ? (
                    <View style={styles.moduleBodyInner}>
                      <Text style={styles.moduleTitle}>{mod.title}</Text>
                      <Text style={styles.moduleMeta}>Successfully mastered</Text>
                      {mod.completed_at ? (
                        <Text style={styles.moduleDate}>Completed {new Date(mod.completed_at).toLocaleDateString()}</Text>
                      ) : null}
                    </View>
                  ) : (
                    <View style={styles.moduleBodyInner}>
                      <View style={styles.moduleTop}>
                        <Text style={[styles.moduleTitle, isCurrent ? { color: theme.accents.home.solid } : { color: theme.light.ink }]} numberOfLines={2}>
                          {mod.title}
                        </Text>
                        {isCurrent ? (
                          <View style={[styles.currentPill, { backgroundColor: theme.accents.home.wash }]}>
                            <Text style={[styles.currentPillText, { color: theme.accents.home.solid }]}>CURRENT</Text>
                          </View>
                        ) : null}
                      </View>
                      {mod.description ? (
                        <Text style={styles.moduleDesc}>{mod.description}</Text>
                      ) : null}

                      {isCurrent && lessons.length > 0 ? (
                        <Pressable
                          onPress={() => setExpandedId(isExpanded ? null : mod.id)}
                          accessibilityRole="button"
                          style={styles.detailsToggle}
                        >
                          <Text style={styles.detailsToggleText}>{isExpanded ? 'Hide Details' : 'More Details'}</Text>
                          <Icon icon={ChevronDown} size={14} color={theme.accents.home.solid} />
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
                                  <View key={i} style={styles.chip}>
                                    <Text style={styles.chipText}>{concept}</Text>
                                  </View>
                                ))}
                              </View>
                            </View>
                          ) : null}

                          {lessons.length > 0 ? (
                            <View>
                              <Text style={styles.expandedLabel}>LESSONS</Text>
                              <View style={styles.lessons}>
                                {lessons.map((lesson, li) => (
                                  <View key={li} style={styles.lesson}>
                                    <View style={styles.lessonTop}>
                                      <Text style={styles.lessonTitle} numberOfLines={1}>
                                        {lesson.title}
                                      </Text>
                                      <Text style={styles.lessonDuration}>{lesson.duration_minutes}m</Text>
                                    </View>
                                    {lesson.description ? <Text style={styles.lessonDesc}>{lesson.description}</Text> : null}
                                    {Array.isArray(lesson.key_topics) && lesson.key_topics.length > 0 ? (
                                      <View style={styles.topicChips}>
                                        {lesson.key_topics.map((topic, ti) => (
                                          <View key={ti} style={styles.topicChip}>
                                            <Text style={styles.topicChipText}>{topic}</Text>
                                          </View>
                                        ))}
                                      </View>
                                    ) : null}
                                  </View>
                                ))}
                              </View>
                            </View>
                          ) : null}

                          <Pressable onPress={() => startModule(mod)} accessibilityRole="button" style={({ pressed }) => [styles.startBtn, pressed && { opacity: 0.85 }]}>
                            <Text style={styles.startBtnText}>START MODULE</Text>
                            <Icon icon={ArrowRight} size={15} color="#FFF" strokeWidth={2.2} />
                          </Pressable>
                        </View>
                      ) : null}
                    </View>
                  )}
                  </Pressable>
                </GlassCard>
              </View>
            );
          })}
        </View>
      )}
    </GlassScreen>
  );
}

const makeStyles = (theme: GlassTheme) => StyleSheet.create({
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: glassRadius.squircle,
    padding: spacing.md,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  heroFill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: { flex: 1, gap: 2 },
  heroEyebrow: { ...theme.glassType.overline, fontSize: 9, color: 'rgba(142,119,230,0.9)' },
  heroTitle: { ...theme.glassType.title, fontSize: 19, lineHeight: 23, letterSpacing: -0.4, color: '#181425' },
  heroProgress: { alignItems: 'flex-end', gap: 4 },
  heroPct: { ...theme.glassType.label, fontSize: 16, color: '#181425', fontWeight: '800' },
  heroTrack: { width: 52, height: 5, borderRadius: 3, backgroundColor: 'rgba(24,20,37,0.1)', overflow: 'hidden' },
  heroTrackFill: { height: '100%', borderRadius: 3, backgroundColor: theme.accents.home.solid },
  timeline: { gap: 0 },
  timelineItem: { flexDirection: 'row', gap: spacing.md },
  dotColumn: { alignItems: 'center', width: 34 },
  dot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: { flex: 1, width: 2, backgroundColor: theme.inkEdge(0.08), marginVertical: 4 },
  moduleCard: { flex: 1, marginBottom: spacing.md },
  moduleDim: { opacity: 0.45 },
  moduleBody: { flex: 1, gap: spacing.sm },
  moduleBodyInner: { gap: spacing.sm },
  moduleTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm },
  moduleTitle: { ...theme.glassType.subtitle, fontSize: 15, flexShrink: 1 },
  moduleMeta: { ...theme.glassType.caption, color: theme.light.inkMuted },
  moduleDate: { ...theme.glassType.caption, color: theme.accents.audio.solid },
  moduleDesc: { ...theme.glassType.body, fontSize: 14, color: theme.light.inkMuted },
  currentPill: { borderRadius: glassRadius.pill, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  currentPillText: { ...theme.glassType.overline, fontSize: 8 },
  detailsToggle: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
  detailsToggleText: { ...theme.glassType.overline, fontSize: 9, color: theme.accents.home.solid },
  expanded: { gap: spacing.md, marginTop: spacing.xs, borderTopWidth: 1, borderTopColor: theme.inkEdge(0.08), paddingTop: spacing.md },
  expandedLabel: { ...theme.glassType.overline, fontSize: 9, color: theme.light.inkMuted, marginBottom: spacing.sm },
  expandedText: { ...theme.glassType.body, fontSize: 14, lineHeight: 20, color: theme.light.inkSoft },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    backgroundColor: theme.inkEdge(0.05),
    borderWidth: 1,
    borderColor: theme.inkEdge(0.08),
    borderRadius: glassRadius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  chipText: { ...theme.glassType.caption, fontSize: 11, color: theme.light.inkSoft },
  lessons: { gap: spacing.sm },
  lesson: {
    backgroundColor: theme.inkEdge(0.04),
    borderRadius: glassRadius.squircle,
    padding: spacing.md,
    gap: spacing.xs,
  },
  lessonTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  lessonTitle: { ...theme.glassType.label, fontSize: 13, fontWeight: '600', flex: 1 },
  lessonDuration: { ...theme.glassType.caption, fontSize: 10, color: theme.light.inkFaint },
  lessonDesc: { ...theme.glassType.caption, fontSize: 12, color: theme.light.inkMuted },
  topicChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 2 },
  topicChip: {
    backgroundColor: 'rgba(124,96,228,0.08)',
    borderRadius: glassRadius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  topicChipText: { ...theme.glassType.caption, fontSize: 9, color: theme.accents.home.solid },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: theme.accents.home.solid,
    borderRadius: glassRadius.pill,
    paddingVertical: spacing.md,
    marginTop: spacing.xs,
  },
  startBtnText: { ...theme.glassType.label, fontSize: 12, color: '#FFF' },
});
