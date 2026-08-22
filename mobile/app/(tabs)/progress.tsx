import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useActiveSession } from '@/lib/activeSession';
import { Icon } from '@/components/glass/Icon';
import { BottomNav } from '@/components/BottomNav';
import {
  BookOpen,
  Check,
  FileText,
  GraduationCap,
  Lock,
  Target,
  TrendingUp,
} from '@/components/glass/icons';

const GREEN = '#6B8E61';
const RED = '#C05050';
const PASS_SCORE = 70;

interface ModuleRow {
  id: string;
  title: string;
  module_index: number;
  status: string | null;
  completed_at: string | null;
}

interface QuizRow {
  id: string;
  title: string;
  score: number | null;
  total_questions: number | null;
  completed: boolean | null;
  created_at: string;
}

export default function ProgressTab() {
  const { session: authSession } = useAuth();
  const { session } = useActiveSession();
  const [modules, setModules] = useState<ModuleRow[]>([]);
  const [quizzes, setQuizzes] = useState<QuizRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!authSession || !session) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [modulesRes, quizzesRes] = await Promise.all([
      supabase
        .from('session_roadmap_modules')
        .select('id, title, module_index, status, completed_at')
        .eq('session_id', session.id)
        .eq('user_id', authSession.user.id)
        .order('module_index', { ascending: true }),
      supabase
        .from('session_quizzes')
        .select('id, title, score, total_questions, completed, created_at')
        .eq('session_id', session.id)
        .eq('user_id', authSession.user.id)
        .order('created_at', { ascending: false }),
    ]);
    if (modulesRes.data) setModules(modulesRes.data as ModuleRow[]);
    if (quizzesRes.data) setQuizzes(quizzesRes.data as QuizRow[]);
    setLoading(false);
  }, [authSession, session]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const completedModules = modules.filter((m) => m.status === 'completed').length;
  const takenQuizzes = quizzes.filter((q) => q.completed);
  const avgScore =
    takenQuizzes.length > 0
      ? Math.round(
          takenQuizzes.reduce((a, q) => a + (q.score ?? 0), 0) / takenQuizzes.length,
        )
      : 0;

  if (!session) {
    return (
      <View style={styles.root}>
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Progress</Text>
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Icon icon={Target} size={28} color="#CCC" />
            </View>
            <Text style={styles.emptyTitle}>No active session</Text>
            <Text style={styles.emptyDesc}>
              Select a session from the Hub to see your progress here.
            </Text>
          </View>
          <View style={{ height: 100 }} />
        </ScrollView>
        <BottomNav />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Progress</Text>
        <Text style={styles.subtitle} numberOfLines={1}>{session.title}</Text>

        <View style={styles.overviewCard}>
          <View style={styles.overviewRow}>
            <View style={styles.overviewItem}>
              <View style={[styles.overviewIconWrap, { backgroundColor: '#F0EEFA' }]}>
                <Icon icon={GraduationCap} size={20} color="#7C69A2" />
              </View>
              <Text style={[styles.overviewValue, { color: '#7C69A2' }]}>
                {loading ? '–' : `${completedModules}/${modules.length}`}
              </Text>
              <Text style={styles.overviewLabel}>Modules</Text>
            </View>
            <View style={styles.overviewDivider} />
            <View style={styles.overviewItem}>
              <View style={[styles.overviewIconWrap, { backgroundColor: '#FFF5E6' }]}>
                <Icon icon={FileText} size={20} color="#EAB308" />
              </View>
              <Text style={[styles.overviewValue, { color: '#EAB308' }]}>
                {loading ? '–' : takenQuizzes.length}
              </Text>
              <Text style={styles.overviewLabel}>Quizzes Taken</Text>
            </View>
            <View style={styles.overviewDivider} />
            <View style={styles.overviewItem}>
              <View style={[styles.overviewIconWrap, { backgroundColor: '#E8F0E5' }]}>
                <Icon icon={TrendingUp} size={20} color={GREEN} />
              </View>
              <Text style={[styles.overviewValue, { color: GREEN }]}>
                {loading ? '–' : `${avgScore}%`}
              </Text>
              <Text style={styles.overviewLabel}>Avg Score</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Module Progress</Text>
        {loading ? (
          <View style={styles.card}>
            <Text style={styles.emptyTextInline}>Loading your progress...</Text>
          </View>
        ) : modules.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.emptyTextInline}>
              No modules yet. Create a session from the Hub to start tracking.
            </Text>
          </View>
        ) : (
          modules.map((mod) => {
            const isCompleted = mod.status === 'completed';
            const isCurrent = mod.status === 'current';
            const statusLabel = isCompleted ? 'COMPLETED' : isCurrent ? 'CURRENT' : 'LOCKED';
            const pct = isCompleted ? 100 : 0;
            return (
              <View key={mod.id} style={styles.card}>
                <View style={styles.moduleTop}>
                  <View
                    style={[
                      styles.moduleDot,
                      isCompleted && styles.moduleDotDone,
                      !isCompleted && !isCurrent && styles.moduleDotLocked,
                    ]}
                  >
                    {isCompleted ? (
                      <Icon icon={Check} size={14} color="#FFF" strokeWidth={3} />
                    ) : !isCurrent ? (
                      <Icon icon={Lock} size={13} color="#CCC" />
                    ) : null}
                  </View>
                  <Text style={[styles.moduleTitle, isCurrent && { color: GREEN }]} numberOfLines={2}>
                    {`Module ${mod.module_index + 1} · ${mod.title}`}
                  </Text>
                  <View
                    style={[
                      styles.statusPill,
                      isCompleted && styles.statusPillDone,
                      isCurrent && styles.statusPillCurrent,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        isCompleted && { color: GREEN },
                        isCurrent && { color: '#B08D3E' },
                      ]}
                    >
                      {statusLabel}
                    </Text>
                  </View>
                </View>
                <View style={styles.track}>
                  <View
                    style={[
                      styles.trackFill,
                      { width: `${pct}%` },
                      !isCompleted && !isCurrent && { backgroundColor: '#DDD5C7' },
                    ]}
                  />
                </View>
                {isCompleted && mod.completed_at ? (
                  <Text style={styles.moduleMeta}>
                    Completed {new Date(mod.completed_at).toLocaleDateString()}
                  </Text>
                ) : isCurrent ? (
                  <Text style={styles.moduleMeta}>In progress — keep going!</Text>
                ) : (
                  <Text style={styles.moduleMeta}>Finish earlier modules to unlock</Text>
                )}
              </View>
            );
          })
        )}

        <Text style={styles.sectionTitle}>Quiz History</Text>
        {loading ? null : quizzes.length === 0 ? (
          <View style={styles.card}>
            <View style={styles.quizEmptyIconWrap}>
              <Icon icon={BookOpen} size={22} color="#CCC" />
            </View>
            <Text style={styles.emptyTextInline}>
              No quizzes yet. Generate one from the Quizzes tab to test yourself.
            </Text>
          </View>
        ) : (
          quizzes.slice(0, 10).map((quiz) => {
            const passed = quiz.completed && (quiz.score ?? 0) >= PASS_SCORE;
            return (
              <View key={quiz.id} style={styles.card}>
                <View style={styles.quizTop}>
                  <Text style={styles.quizTitle} numberOfLines={2}>{quiz.title}</Text>
                  {quiz.completed ? (
                    <View
                      style={[
                        styles.scoreBadge,
                        { backgroundColor: passed ? '#E8F0E5' : '#F3E8E8' },
                      ]}
                    >
                      <Text style={[styles.scoreBadgeText, { color: passed ? GREEN : RED }]}>
                        {quiz.score ?? 0}%
                      </Text>
                    </View>
                  ) : (
                    <View style={[styles.scoreBadge, { backgroundColor: '#F3EDE3' }]}>
                      <Text style={[styles.scoreBadgeText, { color: '#999' }]}>—</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.quizMeta}>
                  {new Date(quiz.created_at).toLocaleDateString()}
                  {' · '}
                  {quiz.total_questions ?? 0} questions
                  {quiz.completed ? (passed ? ' · Passed' : ' · Below passing') : ' · Not taken'}
                </Text>
              </View>
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
  scroll: { flex: 1, paddingHorizontal: 24, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: '700', color: '#333', fontFamily: 'Outfit_700Bold' },
  subtitle: { fontSize: 15, color: '#999', marginTop: 4, marginBottom: 24 },
  overviewCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F3EDE3',
    padding: 20,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 4,
  },
  overviewRow: { flexDirection: 'row', alignItems: 'center' },
  overviewItem: { flex: 1, alignItems: 'center', gap: 6 },
  overviewIconWrap: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  overviewValue: { fontSize: 22, fontWeight: '700', color: '#333' },
  overviewLabel: { fontSize: 11, color: '#999' },
  overviewDivider: { width: 1, height: 48, backgroundColor: '#F3EDE3' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 16 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F3EDE3',
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  moduleTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  moduleDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8F0E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleDotDone: { backgroundColor: GREEN },
  moduleDotLocked: { backgroundColor: '#F3EDE3' },
  moduleTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: '#333', lineHeight: 20 },
  statusPill: { backgroundColor: '#F3EDE3', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  statusPillDone: { backgroundColor: '#E8F0E5' },
  statusPillCurrent: { backgroundColor: '#FBF3E4' },
  statusPillText: { fontSize: 10, fontWeight: '700', color: '#BBB', letterSpacing: 0.5 },
  track: { height: 6, borderRadius: 3, backgroundColor: '#F3EDE3', overflow: 'hidden' },
  trackFill: { height: '100%', borderRadius: 3, backgroundColor: GREEN },
  moduleMeta: { fontSize: 12, color: '#999', marginTop: 8 },
  quizTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  quizTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: '#333', lineHeight: 20 },
  scoreBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  scoreBadgeText: { fontSize: 11, fontWeight: '700' },
  quizMeta: { fontSize: 12, color: '#999', marginTop: 6 },
  quizEmptyIconWrap: { alignSelf: 'center', marginBottom: 8 },
  emptyCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F3EDE3',
    padding: 32,
    alignItems: 'center',
    marginTop: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F9F6F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#333' },
  emptyDesc: { fontSize: 14, color: '#999', textAlign: 'center', lineHeight: 20, marginTop: 6 },
  emptyTextInline: { fontSize: 13, color: '#999', textAlign: 'center', lineHeight: 19 },
});
