import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useActiveSession } from '@/lib/activeSession';
import { generateQuiz, submitQuiz } from '@/lib/api';
import type { QuizQuestion, SessionQuiz } from '@/lib/types';
import { glassRadius, spacing, useTheme, type AccentKey, type GlassTheme } from '@/theme';
import { GlassActionPill, GlassPageHeader } from '@/components/glass/GlassPageHeader';
import { GlassButton } from '@/components/glass/GlassButton';
import { GlassCard } from '@/components/glass/GlassCard';
import { GlassScreen } from '@/components/glass/GlassScreen';
import { GlassSurface } from '@/components/glass/GlassSurface';
import { Icon } from '@/components/glass/Icon';
import { AlertCircle, Check, Play, RefreshCw, Trophy, X } from '@/components/glass/icons';

type QuizView = 'list' | 'taking' | 'results';

interface ModuleInfo {
  id: string;
  title: string;
  module_index: number;
}

export default function QuizzesTab() {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
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

  const question = activeQuiz?.questions[currentQuestion];
  const accent: AccentKey = 'vocab';
  const solid = theme.accents[accent].solid;

  if (!session) {
    return (
      <GlassScreen scroll accent={accent}>
        <GlassPageHeader title="Quizzes" />
        <GlassCard>
          <Text style={theme.glassType.body}>Select a session from the Hub to start quizzing.</Text>
        </GlassCard>
      </GlassScreen>
    );
  }

  return (
    <GlassScreen scroll={view === 'list'} accent={accent}>
      {view === 'list' ? (
        <>
          <GlassPageHeader
            title="Quizzes"
            actions={
              <GlassActionPill
                label={generating ? 'Generating...' : 'Generate'}
                icon={generating ? undefined : RefreshCw}
                onPress={() => handleGenerateQuiz()}
                active
                accent={accent}
                disabled={generating}
              />
            }
          />

          {modules.length > 0 ? (
            <View style={styles.moduleRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.moduleChips}>
                <Pressable onPress={() => setSelectedModule('')} accessibilityRole="button" accessibilityState={{ selected: selectedModule === '' }}>
                  <GlassSurface
                    radius={glassRadius.pill}
                    intensity={selectedModule === '' ? 'thick' : 'regular'}
                    fill={selectedModule === '' ? theme.glass.fillStrong : theme.glass.fillSubtle}
                    tintColor={selectedModule === '' ? theme.accents[accent].wash : undefined}
                    style={styles.moduleChip}
                  >
                    <Text style={[styles.moduleChipLabel, { color: selectedModule === '' ? solid : theme.light.inkMuted }]}>GENERAL</Text>
                  </GlassSurface>
                </Pressable>
                {modules.map((m) => {
                  const active = selectedModule === m.id;
                  return (
                    <Pressable key={m.id} onPress={() => setSelectedModule(m.id)} accessibilityRole="button" accessibilityState={{ selected: active }}>
                      <GlassSurface
                        radius={glassRadius.pill}
                        intensity={active ? 'thick' : 'regular'}
                        fill={active ? theme.glass.fillStrong : theme.glass.fillSubtle}
                        tintColor={active ? theme.accents[accent].wash : undefined}
                        style={styles.moduleChip}
                      >
                        <Text style={[styles.moduleChipLabel, { color: active ? solid : theme.light.inkMuted }]} numberOfLines={1}>{m.title}</Text>
                      </GlassSurface>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}

          {error ? (
            <GlassCard style={styles.errorCard}>
              <View style={styles.errorRow}>
                <Icon icon={AlertCircle} size={18} color={theme.accents.data.solid} />
                <Text style={[styles.errorText, { color: theme.accents.data.solid }]}>{error}</Text>
              </View>
            </GlassCard>
          ) : null}

          {loading ? (
            <GlassCard><Text style={theme.glassType.body}>Loading quizzes...</Text></GlassCard>
          ) : quizzes.length === 0 ? (
            <GlassCard>
              <View style={styles.empty}>
                <Icon icon={Trophy} size={30} color={theme.light.inkFaint} />
                <Text style={theme.glassType.subtitle}>No quizzes yet</Text>
                <Text style={theme.glassType.body}>Generate a quiz on a module (or general knowledge) to test yourself.</Text>
              </View>
            </GlassCard>
          ) : (
            quizzes.map((q) => {
              const pct = q.total_questions > 0 ? Math.round(((q.score ?? 0) / q.total_questions) * 100) : 0;
              return (
                <GlassCard key={q.id} style={styles.quizCard}>
                  <Pressable onPress={() => startQuiz(q)} accessibilityRole="button">
                    <View style={styles.quizTop}>
                      <Text style={styles.quizTitle} numberOfLines={2}>{q.title}</Text>
                      {q.completed ? (
                        <View style={[styles.scoreBadge, { backgroundColor: pct >= 70 ? theme.accents.audio.wash : theme.accents.data.wash }]}>
                          <Text style={[styles.scoreText, { color: pct >= 70 ? theme.accents.audio.solid : theme.accents.data.solid }]}>{pct}%</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.quizMeta}>{q.questions.length} questions · {q.completed ? 'Completed' : 'Not taken'}</Text>
                    <View style={styles.quizAction}>
                      <Icon icon={Play} size={14} color={solid} />
                      <Text style={[styles.quizActionText, { color: solid }]}>{q.completed ? 'RETRY' : 'START'}</Text>
                    </View>
                  </Pressable>
                </GlassCard>
              );
            })
          )}
        </>
      ) : activeQuiz && question ? (
        <>
          <GlassPageHeader
            title={submitted ? 'Results' : activeQuiz.title}
            actions={
              !submitted ? (
                <GlassActionPill
                  label="Exit"
                  icon={X}
                  onPress={() => { setView('list'); setActiveQuiz(null); }}
                  danger
                />
              ) : undefined
            }
          />

          {/* Progress */}
          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${((currentQuestion) / activeQuiz.questions.length) * 100}%`, backgroundColor: solid }]} />
            </View>
            <Text style={styles.progressText}>{currentQuestion + 1} / {activeQuiz.questions.length}</Text>
          </View>

          {submitted ? (
            <View style={styles.results}>
              <View style={[styles.resultsRing, { borderColor: score! >= 70 ? theme.accents.audio.solid : theme.accents.data.solid }]}>
                <Text style={[styles.resultsScore, { color: score! >= 70 ? theme.accents.audio.solid : theme.accents.data.solid }]}>{score}%</Text>
              </View>
              <Text style={theme.glassType.subtitle}>{score! >= 70 ? 'Great work!' : 'Keep practicing!'}</Text>
              <Text style={styles.resultsMeta}>You got {selectedAnswers.filter((a, i) => a === activeQuiz.questions[i].correct_index).length} of {activeQuiz.questions.length} correct.</Text>
              {activeQuiz.questions.map((q, qi) => {
                const correct = selectedAnswers[qi] === q.correct_index;
                const picked = selectedAnswers[qi];
                return (
                  <GlassCard key={qi} style={styles.reviewCard}>
                    <Text style={styles.reviewQuestion}>{qi + 1}. {q.question}</Text>
                    <View style={styles.reviewAnswer}>
                      <Icon icon={correct ? Check : X} size={14} color={correct ? theme.accents.audio.solid : theme.accents.data.solid} />
                      <Text style={[styles.reviewText, { color: correct ? theme.accents.audio.solid : theme.accents.data.solid }]}>
                        {correct ? 'Correct' : `Correct answer: ${q.options[q.correct_index]}`}
                      </Text>
                    </View>
                    {!correct && picked >= 0 ? (
                      <View style={styles.reviewAnswer}>
                        <Text style={[styles.reviewText, { color: theme.accents.data.solid }]}>Your pick: {q.options[picked]}</Text>
                      </View>
                    ) : null}
                    {q.explanation ? (
                      <Text style={styles.reviewExplanation}>{q.explanation}</Text>
                    ) : null}
                  </GlassCard>
                );
              })}
              <GlassButton label="Back to Quizzes" onPress={() => { setView('list'); setActiveQuiz(null); }} icon={Trophy} accent={accent} />
            </View>
          ) : (
            <>
              <GlassCard style={styles.questionCard}>
                <Text style={[styles.questionOverline, { color: solid }]}>QUESTION {currentQuestion + 1} OF {activeQuiz.questions.length}</Text>
                <Text style={styles.questionText}>{question.question}</Text>
              </GlassCard>
              <View style={styles.answers}>
                {question.options.map((opt, i) => {
                  const selected = selectedAnswers[currentQuestion] === i;
                  return (
                    <Pressable key={i} onPress={() => selectAnswer(i)} accessibilityRole="radio" accessibilityState={{ selected }}>
                      <GlassSurface
                        radius={glassRadius.card}
                        intensity={selected ? 'thick' : 'regular'}
                        fill={selected ? theme.glass.fillStrong : theme.glass.fillSubtle}
                        tintColor={selected ? theme.accents[accent].wash : undefined}
                        style={[styles.answer, selected && { borderColor: solid, borderWidth: 1.5 }]}
                      >
                        <View style={[styles.answerLetter, { backgroundColor: selected ? solid : theme.inkEdge(0.06) }]}>
                          <Text style={[styles.answerLetterText, { color: selected ? '#FFF' : theme.light.inkMuted }]}>
                            {String.fromCharCode(65 + i)}
                          </Text>
                        </View>
                        <Text style={[styles.answerText, { color: selected ? theme.light.ink : theme.light.inkSoft }]}>{opt}</Text>
                        {selected ? <Icon icon={Check} size={16} color={solid} strokeWidth={2.5} /> : null}
                      </GlassSurface>
                    </Pressable>
                  );
                })}
              </View>
              <GlassButton
                label={currentQuestion === activeQuiz.questions.length - 1 ? 'Submit Quiz' : 'Next Question'}
                onPress={() =>
                  currentQuestion < activeQuiz.questions.length - 1
                    ? setCurrentQuestion((c) => c + 1)
                    : handleSubmit()
                }
                disabled={selectedAnswers[currentQuestion] === -1}
                size="lg"
                accent={accent}
              />
            </>
          )}
        </>
      ) : null}
    </GlassScreen>
  );
}

const makeStyles = (theme: GlassTheme) => StyleSheet.create({
  moduleRow: { marginBottom: spacing.lg },
  moduleChips: { gap: spacing.sm, paddingRight: spacing.lg },
  moduleChip: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, maxWidth: 220 },
  moduleChipLabel: { ...theme.glassType.label, fontSize: 13 },
  errorCard: { marginBottom: spacing.md },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  errorText: { ...theme.glassType.body, flex: 1 },
  empty: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg, textAlign: 'center' },
  quizCard: { marginBottom: spacing.md },
  quizTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md },
  quizTitle: { ...theme.glassType.subtitle, fontSize: 15, flex: 1 },
  scoreBadge: { borderRadius: glassRadius.pill, paddingHorizontal: spacing.md, paddingVertical: 4 },
  scoreText: { ...theme.glassType.overline, fontSize: 10 },
  quizMeta: { ...theme.glassType.caption, marginTop: 4 },
  quizAction: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.sm },
  quizActionText: { ...theme.glassType.overline, fontSize: 10 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
  progressTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: theme.inkEdge(0.08), overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: { ...theme.glassType.label, fontSize: 13 },
  questionCard: { marginBottom: spacing.lg },
  questionOverline: { ...theme.glassType.overline, fontSize: 10, letterSpacing: 1.6, marginBottom: spacing.sm },
  questionText: { ...theme.glassType.subtitle, fontSize: 18, lineHeight: 26 },
  answers: { gap: spacing.sm, marginBottom: spacing.lg },
  answer: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  answerLetter: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  answerLetterText: { ...theme.glassType.label, fontSize: 13 },
  answerText: { flex: 1, fontSize: 15, lineHeight: 21 },
  results: { gap: spacing.md, alignItems: 'center' },
  resultsRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  resultsScore: { ...theme.glassType.display, fontSize: 36 },
  resultsMeta: { ...theme.glassType.body, color: theme.light.inkMuted },
  reviewCard: { width: '100%', marginBottom: spacing.xs },
  reviewQuestion: { ...theme.glassType.label, fontSize: 13, lineHeight: 19 },
  reviewAnswer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.xs },
  reviewText: { ...theme.glassType.caption, fontSize: 12, flexShrink: 1 },
  reviewExplanation: { ...theme.glassType.body, fontSize: 13, lineHeight: 19, marginTop: spacing.sm, color: theme.light.inkSoft },
});
