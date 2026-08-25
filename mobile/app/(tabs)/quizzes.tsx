import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useActiveSession } from '@/lib/activeSession';
import { generateQuiz, submitQuiz } from '@/lib/api';
import type { QuizQuestion, SessionQuiz } from '@/lib/types';
import { Icon } from '@/components/glass/Icon';
import { BottomNav } from '@/components/BottomNav';
import {
  AlertCircle,
  Check,
  ChevronRight,
  Play,
  RefreshCw,
  Trophy,
  X,
} from '@/components/glass/icons';

const GREEN = '#6B8E61';
const RED = '#C05050';

type QuizView = 'list' | 'taking' | 'results';

interface ModuleInfo {
  id: string;
  title: string;
  module_index: number;
}

export default function QuizzesTab() {
  const { session: authSession } = useAuth();
  const { session } = useActiveSession();
  const [modules, setModules] = useState<ModuleInfo[]>([]);
  const [quizzes, setQuizzes] = useState<SessionQuiz[]>([]);
  const [view, setView] = useState<QuizView>('list');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [error, setError] = useState('');

  const [activeQuiz, setActiveQuiz] = useState<SessionQuiz | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    if (!authSession || !session) {
      setLoading(false);
      return;
    }
    const [modulesRes, quizzesRes] = await Promise.all([
      supabase
        .from('session_roadmap_modules')
        .select('id, title, module_index')
        .eq('session_id', session.id)
        .eq('user_id', authSession.user.id)
        .order('module_index'),
      supabase
        .from('session_quizzes')
        .select('*')
        .eq('session_id', session.id)
        .eq('user_id', authSession.user.id)
        .order('created_at', { ascending: false }),
    ]);
    if (modulesRes.data) setModules(modulesRes.data as ModuleInfo[]);
    if (quizzesRes.data) {
      setQuizzes((quizzesRes.data as SessionQuiz[]).map((q) => ({
        ...q,
        questions: typeof q.questions === 'string' ? JSON.parse(q.questions as string) : q.questions,
      })));
    }
    setLoading(false);
  }, [authSession, session]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleGenerateQuiz = async (moduleId?: string) => {
    if (!session) return;
    setGenerating(true);
    setError('');
    try {
      const data = await generateQuiz({
        module_id: moduleId || selectedModule || undefined,
        session_id: session.id,
        subject: session.subject || undefined,
        num_questions: 8,
      });
      setQuizzes((prev) => [data.quiz as unknown as SessionQuiz, ...prev]);
      startQuiz(data.quiz as unknown as SessionQuiz);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate quiz');
    } finally {
      setGenerating(false);
    }
  };

  const startQuiz = (quiz: SessionQuiz) => {
    setActiveQuiz(quiz);
    setCurrentQuestion(0);
    setSelectedAnswers(new Array(quiz.questions.length).fill(-1));
    setSubmitted(false);
    setScore(null);
    setView('taking');
  };

  const selectAnswer = (answerIdx: number) => {
    if (submitted) return;
    setSelectedAnswers((prev) => {
      const next = [...prev];
      next[currentQuestion] = answerIdx;
      return next;
    });
  };

  const exitQuiz = () => {
    setView('list');
    setActiveQuiz(null);
  };

  const handleSubmit = async () => {
    if (!activeQuiz) return;
    const correct = selectedAnswers.filter((a, i) => a === activeQuiz.questions[i].correct_index).length;
    const pct = Math.round((correct / activeQuiz.questions.length) * 100);
    setScore(pct);
    setSubmitted(true);
    setView('results');
    try {
      await submitQuiz(activeQuiz.id, pct);
      setQuizzes((prev) => prev.map((q) => (q.id === activeQuiz.id ? { ...q, score: pct, completed: true } : q)));
    } catch {
      // save failed — still show results
    }
  };

  const question: QuizQuestion | undefined = activeQuiz?.questions[currentQuestion];

  if (!session) {
    return (
      <View style={styles.root}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.pageTitle}>Quizzes</Text>
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Icon icon={Trophy} size={28} color="#CCC" />
            </View>
            <Text style={styles.emptyTitle}>No active session</Text>
            <Text style={styles.emptyDesc}>Select a session from the Hub to start quizzing.</Text>
          </View>
          <View style={{ height: 120 }} />
        </ScrollView>
        <BottomNav />
      </View>
    );
  }

  if (view === 'taking' && activeQuiz && question) {
    return (
      <View style={styles.root}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.takeHeader}>
            <Text style={styles.takeTitle} numberOfLines={1}>{activeQuiz.title}</Text>
            <Pressable onPress={exitQuiz} accessibilityRole="button" style={styles.exitBtn} hitSlop={8}>
              <Icon icon={X} size={13} color="#999" strokeWidth={2.5} />
              <Text style={styles.exitBtnText}>EXIT</Text>
            </Pressable>
          </View>

          {/* Progress */}
          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${(currentQuestion / activeQuiz.questions.length) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.progressCount}>{currentQuestion + 1} / {activeQuiz.questions.length}</Text>
          </View>

          {/* Question card */}
          <View style={styles.card}>
            <Text style={styles.questionOverline}>QUESTION {currentQuestion + 1} OF {activeQuiz.questions.length}</Text>
            <Text style={styles.questionText}>{question.question}</Text>
          </View>

          {/* Answers */}
          <View style={styles.answers}>
            {question.options.map((opt, i) => {
              const selected = selectedAnswers[currentQuestion] === i;
              return (
                <Pressable key={i} onPress={() => selectAnswer(i)} accessibilityRole="radio" accessibilityState={{ selected }}>
                  <View style={[styles.answerCard, selected && styles.answerSelected]}>
                    <View style={[styles.answerLetter, selected && styles.answerLetterSelected]}>
                      <Text style={[styles.answerLetterText, selected && styles.answerLetterTextSelected]}>
                        {String.fromCharCode(65 + i)}
                      </Text>
                    </View>
                    <Text style={[styles.answerText, selected && styles.answerTextSelected]}>{opt}</Text>
                    {selected ? <Icon icon={Check} size={16} color={GREEN} strokeWidth={2.5} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: selectedAnswers[currentQuestion] === -1 }}
            disabled={selectedAnswers[currentQuestion] === -1}
            onPress={() =>
              currentQuestion < activeQuiz.questions.length - 1
                ? setCurrentQuestion((c) => c + 1)
                : handleSubmit()
            }
            style={[
              styles.primaryBtn,
              selectedAnswers[currentQuestion] === -1 && styles.primaryBtnDisabled,
            ]}
          >
            <Text style={styles.primaryBtnText}>
              {currentQuestion === activeQuiz.questions.length - 1 ? 'SUBMIT QUIZ' : 'NEXT QUESTION'}
            </Text>
          </Pressable>

          <View style={{ height: 60 }} />
        </ScrollView>
      </View>
    );
  }

  if (view === 'results' && activeQuiz) {
    const passed = (score ?? 0) >= 70;
    const correctCount = selectedAnswers.filter(
      (a, i) => a === activeQuiz.questions[i].correct_index,
    ).length;
    return (
      <View style={styles.root}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.takeHeader}>
            <Text style={styles.takeTitle}>Results</Text>
          </View>

          <View style={styles.resultsBlock}>
            <View style={[styles.scoreRing, { borderColor: passed ? GREEN : RED }]}>
              <Text style={[styles.scoreRingValue, { color: passed ? GREEN : RED }]}>{score}%</Text>
            </View>
            <Text style={styles.resultsHeadline}>{passed ? 'Great work!' : 'Keep practicing!'}</Text>
            <Text style={styles.resultsMeta}>
              You got {correctCount} of {activeQuiz.questions.length} correct.
            </Text>
          </View>

          {activeQuiz.questions.map((q, qi) => {
            const correct = selectedAnswers[qi] === q.correct_index;
            const picked = selectedAnswers[qi];
            return (
              <View key={qi} style={styles.card}>
                <Text style={styles.reviewQuestion}>{qi + 1}. {q.question}</Text>
                <View style={styles.reviewRow}>
                  <Icon icon={correct ? Check : X} size={14} color={correct ? GREEN : RED} strokeWidth={2.5} />
                  <Text style={[styles.reviewText, { color: correct ? GREEN : RED }]}>
                    {correct ? 'Correct' : `Correct answer: ${q.options[q.correct_index]}`}
                  </Text>
                </View>
                {!correct && picked >= 0 ? (
                  <View style={styles.reviewRow}>
                    <Icon icon={AlertCircle} size={14} color={RED} />
                    <Text style={[styles.reviewText, { color: RED }]}>Your pick: {q.options[picked]}</Text>
                  </View>
                ) : null}
                {q.explanation ? (
                  <Text style={styles.reviewExplanation}>{q.explanation}</Text>
                ) : null}
              </View>
            );
          })}

          <Pressable onPress={exitQuiz} accessibilityRole="button" style={styles.primaryBtn}>
            <Icon icon={Trophy} size={15} color="#FFF" strokeWidth={2.2} />
            <Text style={styles.primaryBtnText}>BACK TO QUIZZES</Text>
          </Pressable>

          <View style={{ height: 60 }} />
        </ScrollView>
      </View>
    );
  }

  // List view
  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Page header */}
        <View style={styles.listHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.overline}>TEST YOURSELF</Text>
            <Text style={styles.pageTitle}>Quizzes</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: generating }}
            disabled={generating}
            onPress={() => handleGenerateQuiz()}
            style={[styles.generateBtn, generating && styles.generateBtnDisabled]}
          >
            {!generating ? <Icon icon={RefreshCw} size={14} color="#FFF" strokeWidth={2.2} /> : null}
            <Text style={styles.generateBtnText}>{generating ? 'GENERATING...' : 'GENERATE'}</Text>
          </Pressable>
        </View>

        {/* Module filter chips */}
        {modules.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 20 }}
            contentContainerStyle={{ gap: 8, paddingRight: 24 }}
          >
            <Pressable onPress={() => setSelectedModule('')} accessibilityRole="button" accessibilityState={{ selected: selectedModule === '' }}>
              <View style={[styles.moduleChip, selectedModule === '' && styles.moduleChipActive]}>
                <Text style={[styles.moduleChipLabel, selectedModule === '' && styles.moduleChipLabelActive]}>GENERAL</Text>
              </View>
            </Pressable>
            {modules.map((m) => {
              const active = selectedModule === m.id;
              return (
                <Pressable key={m.id} onPress={() => setSelectedModule(m.id)} accessibilityRole="button" accessibilityState={{ selected: active }}>
                  <View style={[styles.moduleChip, styles.moduleChipWide, active && styles.moduleChipActive]}>
                    <Text style={[styles.moduleChipLabel, active && styles.moduleChipLabelActive]} numberOfLines={1}>{m.title}</Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

        {error ? (
          <View style={[styles.card, styles.errorCard]}>
            <Icon icon={AlertCircle} size={18} color={RED} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyDesc}>Loading quizzes...</Text>
          </View>
        ) : quizzes.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Icon icon={Trophy} size={28} color="#CCC" />
            </View>
            <Text style={styles.emptyTitle}>No quizzes yet</Text>
            <Text style={styles.emptyDesc}>
              Generate a quiz on a module (or general knowledge) to test yourself.
            </Text>
          </View>
        ) : (
           quizzes.map((q) => {
             const pct = Math.max(0, Math.min(100, Math.round(q.score ?? 0)));
            return (
              <Pressable key={q.id} accessibilityRole="button" onPress={() => startQuiz(q)} style={styles.card}>
                <View style={styles.quizTop}>
                  <Text style={styles.quizTitle} numberOfLines={2}>{q.title}</Text>
                  {q.completed ? (
                    <View style={[styles.scoreBadge, { backgroundColor: pct >= 70 ? '#E8F0E5' : '#F3E8E8' }]}>
                      <Text style={[styles.scoreBadgeText, { color: pct >= 70 ? GREEN : RED }]}>{pct}%</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.quizMeta}>
                  {q.questions.length} questions · {q.completed ? 'Completed' : 'Not taken'}
                </Text>
                <View style={styles.quizAction}>
                  <Icon icon={Play} size={12} color={GREEN} />
                  <Text style={styles.quizActionText}>{q.completed ? 'RETRY' : 'START'}</Text>
                  <Icon icon={ChevronRight} size={13} color="#CCC" strokeWidth={2.2} />
                </View>
              </Pressable>
            );
          })
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
  scrollContent: { paddingTop: 60, paddingHorizontal: 24 },

  // Typography
  overline: { fontSize: 10, fontWeight: '700', color: GREEN, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  pageTitle: { fontSize: 28, fontWeight: '700', color: '#333' },

  // Cards
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

  // List header
  listHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: GREEN,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  generateBtnDisabled: { opacity: 0.55 },
  generateBtnText: { fontSize: 11, fontWeight: '700', color: '#FFF', letterSpacing: 0.5 },

  // Module chips
  moduleChip: {
    backgroundColor: '#F3EDE3',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
    alignSelf: 'flex-start',
  },
  moduleChipWide: { maxWidth: 200 },
  moduleChipActive: { backgroundColor: GREEN },
  moduleChipLabel: { fontSize: 12, fontWeight: '700', color: '#666', letterSpacing: 0.3 },
  moduleChipLabelActive: { color: '#FFF' },

  // Error
  errorCard: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  errorText: { flex: 1, fontSize: 13, lineHeight: 18, color: RED, fontWeight: '600' },

  // Quiz cards
  quizTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  quizTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: '#333', lineHeight: 21 },
  scoreBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  scoreBadgeText: { fontSize: 11, fontWeight: '700' },
  quizMeta: { fontSize: 12, color: '#999', marginTop: 4 },
  quizAction: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 12 },
  quizActionText: { fontSize: 10, fontWeight: '700', color: GREEN, letterSpacing: 0.5 },

  // Taking header
  takeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 20 },
  takeTitle: { flex: 1, fontSize: 22, fontWeight: '700', color: '#333' },
  exitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F3EDE3',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  exitBtnText: { fontSize: 10, fontWeight: '700', color: '#999', letterSpacing: 0.5 },

  // Progress
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  progressTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: '#F3EDE3', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: GREEN },
  progressCount: { fontSize: 12, fontWeight: '700', color: '#999' },

  // Question
  questionOverline: { fontSize: 10, fontWeight: '700', color: GREEN, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 },
  questionText: { fontSize: 18, fontWeight: '600', color: '#333', lineHeight: 26 },

  // Answers
  answers: { gap: 10, marginBottom: 24 },
  answerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F3EDE3',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  answerSelected: { borderWidth: 1.5, borderColor: GREEN, backgroundColor: '#FBFCF9' },
  answerLetter: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3EDE3',
  },
  answerLetterSelected: { backgroundColor: GREEN },
  answerLetterText: { fontSize: 13, fontWeight: '700', color: '#999' },
  answerLetterTextSelected: { color: '#FFF' },
  answerText: { flex: 1, fontSize: 14, lineHeight: 20, color: '#666' },
  answerTextSelected: { color: '#333', fontWeight: '600' },

  // Buttons
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: GREEN,
    borderRadius: 22,
    paddingVertical: 16,
    marginTop: 4,
  },
  primaryBtnDisabled: { opacity: 0.45 },
  primaryBtnText: { fontSize: 12, fontWeight: '700', color: '#FFF', letterSpacing: 0.8 },

  // Results
  resultsBlock: { alignItems: 'center', marginBottom: 24 },
  scoreRing: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 6,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 4,
  },
  scoreRingValue: { fontSize: 34, fontWeight: '800' },
  resultsHeadline: { fontSize: 18, fontWeight: '700', color: '#333' },
  resultsMeta: { fontSize: 13, color: '#999', marginTop: 4 },

  // Review
  reviewQuestion: { fontSize: 13, fontWeight: '700', color: '#333', lineHeight: 19 },
  reviewRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  reviewText: { fontSize: 12, fontWeight: '600', flexShrink: 1, lineHeight: 17 },
  reviewExplanation: { fontSize: 12, color: '#999', lineHeight: 18, marginTop: 10 },

  // Empty / no session
  emptyCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F3EDE3',
    padding: 32,
    alignItems: 'center',
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
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginTop: 2 },
  emptyDesc: { fontSize: 14, color: '#999', textAlign: 'center', lineHeight: 20, marginTop: 6 },
});
