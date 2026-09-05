import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useActiveSession } from '@/lib/activeSession';
import { Icon } from '@/components/glass/Icon';
import { BottomNav } from '@/components/BottomNav';
import { Stamp, Kicker, EditorialPageHeader, SERIF } from '@/components/editorial';
import {
  BookOpen,
  Check,
  FileText,
  GraduationCap,
  Lock,
  Target,
  TrendingUp,
} from '@/components/glass/icons';

const GREEN = '#3F5C3A';
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
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <EditorialPageHeader title="Progress" rule={false} />
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Icon icon={Target} size={28} color="#8A8478" />
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
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <EditorialPageHeader kicker="Your learning ledger" title="Progress" subtitle={session.title} />

        <View style={styles.overviewCard}>
          <View style={styles.overviewRow}>
            <View style={styles.overviewItem}>
              <View style={[styles.overviewIconWrap, { backgroundColor: '#F3EDE3' }]}>
                <Icon icon={GraduationCap} size={20} color="#2D3436" />
              </View>
              <Text style={styles.overviewValue}>
                {loading ? '–' : `${completedModules}/${modules.length}`}
              </Text>
              <Text style={styles.overviewLabel}>Modules</Text>
            </View>
            <View style={styles.overviewDivider} />
            <View style={styles.overviewItem}>
              <View style={[styles.overviewIconWrap, { backgroundColor: '#F3EDE3' }]}>
                <Icon icon={FileText} size={20} color="#C9772E" />
              </View>
              <Text style={[styles.overviewValue, { color: '#C9772E' }]}>
                {loading ? '–' : takenQuizzes.length}
              </Text>
              <Text style={styles.overviewLabel}>Quizzes Taken</Text>
            </View>
            <View style={styles.overviewDivider} />
            <View style={styles.overviewItem}>
              <View style={[styles.overviewIconWrap, { backgroundColor: '#F3EDE3' }]}>
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
                      <Icon icon={Check} size={14} color="#FDFBF7" strokeWidth={3} />
                    ) : !isCurrent ? (
                      <Icon icon={Lock} size={13} color="#8A8478" />
                    ) : null}
                  </View>
                  <Text style={[styles.moduleTitle, isCurrent && { color: GREEN }]} numberOfLines={2}>
                    {`Module ${mod.module_index + 1} · ${mod.title}`}
                  </Text>
                  {isCompleted ? (
                    <Stamp tone="forest" rotate={-2}>{statusLabel}</Stamp>
                  ) : isCurrent ? (
                    <Stamp tone="ink" rotate={2}>{statusLabel}</Stamp>
                  ) : (
                    <Stamp tone="ink" rotate={-1} style={styles.statusLocked}>{statusLabel}</Stamp>
                  )}
                </View>
                <View style={styles.track}>
                  <View
                    style={[
                      styles.trackFill,
                      { width: `${pct}%` },
                      !isCompleted && !isCurrent && { backgroundColor: '#EFEAE0' },
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
              <Icon icon={BookOpen} size={22} color="#8A8478" />
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
                    <Stamp tone="forest" rotate={passed ? -2 : 2}>{quiz.score ?? 0}%</Stamp>
                  ) : (
                    <Stamp tone="ink" rotate={-1} style={styles.statusLocked}>—</Stamp>
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
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  title: { fontSize: 30, fontWeight: '700', color: '#2D3436', fontFamily: SERIF, letterSpacing: 0.2 },
  subtitle: { fontSize: 15, color: '#8A8478', marginTop: 4, marginBottom: 24, fontFamily: SERIF },
  overviewCard: {
    backgroundColor: '#FDFBF7',
    borderRadius: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 7,
    borderWidth: 2,
    borderColor: '#2D3436',
    padding: 20,
    marginBottom: 32,
    boxShadow: '4px 4px 0 0 #2D3436',
  },
  overviewRow: { flexDirection: 'row', alignItems: 'center' },
  overviewItem: { flex: 1, alignItems: 'center', gap: 6 },
  overviewIconWrap: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  overviewValue: { fontSize: 22, fontWeight: '700', color: '#2D3436', fontFamily: SERIF },
  overviewLabel: { fontSize: 11, color: '#8A8478', fontFamily: SERIF },
  overviewDivider: { width: 1, height: 48, backgroundColor: '#EFEAE0' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#2D3436', marginBottom: 16, fontFamily: SERIF },
  card: {
    backgroundColor: '#FDFBF7',
    borderRadius: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 7,
    borderWidth: 2,
    borderColor: '#2D3436',
    padding: 16,
    marginBottom: 12,
    boxShadow: '4px 4px 0 0 #2D3436',
  },
  moduleTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  moduleDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3EDE3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleDotDone: { backgroundColor: GREEN },
  moduleDotLocked: { backgroundColor: '#EFEAE0' },
  moduleTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: '#2D3436', lineHeight: 20, fontFamily: SERIF },
  track: { height: 6, borderRadius: 3, backgroundColor: '#EFEAE0', overflow: 'hidden' },
  trackFill: { height: '100%', borderRadius: 3, backgroundColor: GREEN },
  moduleMeta: { fontSize: 12, color: '#8A8478', marginTop: 8, fontFamily: SERIF },
  quizTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  quizTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: '#2D3436', lineHeight: 20, fontFamily: SERIF },
  scoreBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  scoreBadgeText: { fontSize: 11, fontWeight: '700' },
  statusLocked: { opacity: 0.55 },
  quizMeta: { fontSize: 12, color: '#8A8478', marginTop: 6, fontFamily: SERIF },
  quizEmptyIconWrap: { alignSelf: 'center', marginBottom: 8 },
  emptyCard: {
    backgroundColor: '#FDFBF7',
    borderRadius: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 7,
    borderWidth: 2,
    borderColor: '#2D3436',
    padding: 32,
    alignItems: 'center',
    marginTop: 40,
    boxShadow: '4px 4px 0 0 #2D3436',
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3EDE3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#2D3436', fontFamily: SERIF },
  emptyDesc: { fontSize: 14, color: '#555E61', textAlign: 'center', lineHeight: 20, marginTop: 6, fontFamily: SERIF },
  emptyTextInline: { fontSize: 13, color: '#555E61', textAlign: 'center', lineHeight: 19, fontFamily: SERIF },
});
