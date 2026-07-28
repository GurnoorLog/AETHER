"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { use } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "../layout";
import SidebarRight from "@/components/SidebarRight";
import SidebarLeft from "@/components/SidebarLeft";
import type { QuizQuestion, SessionQuiz } from "@/types/database";

interface ModuleInfo {
  id: string;
  title: string;
  module_index: number;
}

type View = "list" | "taking" | "results";

export default function SessionQuizzesPage({ params }: { params: Promise<{ session: string }> }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.session;
  const searchParams = useSearchParams();
  const preselectedModule = searchParams.get("module");

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { session } = useSession();

  const [modules, setModules] = useState<ModuleInfo[]>([]);
  const [quizzes, setQuizzes] = useState<SessionQuiz[]>([]);
  const [view, setView] = useState<View>("list");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedModule, setSelectedModule] = useState<string>(preselectedModule || "");

  // Quiz taking state
  const [activeQuiz, setActiveQuiz] = useState<SessionQuiz | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/");
  }, [user, authLoading, router]);

  const fetchData = useCallback(async () => {
    if (!user || !session) return;
    const supabase = createClient();

    const [modulesRes, quizzesRes] = await Promise.all([
      supabase
        .from("session_roadmap_modules")
        .select("id, title, module_index")
        .eq("session_id", session.id)
        .eq("user_id", user.id)
        .order("module_index"),
      supabase
        .from("session_quizzes")
        .select("*")
        .eq("session_id", session.id)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    if (modulesRes.data) setModules(modulesRes.data as ModuleInfo[]);
    if (quizzesRes.data) {
      setQuizzes(quizzesRes.data.map((q) => ({
        ...q,
        questions: typeof q.questions === "string" ? JSON.parse(q.questions) : q.questions,
      })) as SessionQuiz[]);
    }
    setLoading(false);
  }, [user, session]);

  useEffect(() => {
    if (user) fetchData();
  }, [user, fetchData]);

  // Auto-start quiz if preselected module
  useEffect(() => {
    if (preselectedModule && !loading && quizzes.length === 0 && !generating) {
      handleGenerateQuiz(preselectedModule);
    }
  }, [preselectedModule, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGenerateQuiz = useCallback(async (moduleId?: string) => {
    if (!session) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/quizzes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          module_id: moduleId || selectedModule || undefined,
          session_id: session.id,
          subject: session.subject,
          num_questions: 10,
        }),
      });
      const data = await res.json();
      if (data.quiz) {
        setQuizzes((prev) => [data.quiz, ...prev]);
        startQuiz(data.quiz);
      }
    } catch (err) {
      console.error("Failed to generate quiz:", err);
    } finally {
      setGenerating(false);
    }
  }, [session, selectedModule]);

  const startQuiz = (quiz: SessionQuiz) => {
    setActiveQuiz(quiz);
    setCurrentQuestion(0);
    setSelectedAnswers(new Array(quiz.questions.length).fill(-1));
    setSubmitted(false);
    setScore(null);
    setView("taking");
  };

  const selectAnswer = (questionIdx: number, answerIdx: number) => {
    if (submitted) return;
    setSelectedAnswers((prev) => {
      const next = [...prev];
      next[questionIdx] = answerIdx;
      return next;
    });
  };

  const submitQuiz = useCallback(async () => {
    if (!activeQuiz || !user) return;

    let correct = 0;
    activeQuiz.questions.forEach((q: QuizQuestion, i: number) => {
      if (selectedAnswers[i] === q.correct_index) correct++;
    });
    const finalScore = Math.round((correct / activeQuiz.questions.length) * 100);
    setScore(finalScore);
    setSubmitted(true);

    // Save score
    const supabase = createClient();
    await supabase
      .from("session_quizzes")
      .update({ score: finalScore, completed: true })
      .eq("id", activeQuiz.id);

    // Update local state
    setQuizzes((prev) =>
      prev.map((q) => q.id === activeQuiz.id ? { ...q, score: finalScore, completed: true } : q)
    );

    setView("results");
  }, [activeQuiz, selectedAnswers, user]);

  const goToList = () => {
    setView("list");
    setActiveQuiz(null);
  };

  const deleteQuiz = useCallback(async (quizId: string) => {
    if (!user) return;
    const supabase = createClient();
    await supabase.from("session_quizzes").delete().eq("id", quizId);
    setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
  }, [user]);

  const completedQuizzes = quizzes.filter((q) => q.completed);
  const avgScore = completedQuizzes.length > 0
    ? Math.round(completedQuizzes.reduce((a, q) => a + (q.score || 0), 0) / completedQuizzes.length)
    : 0;

  if (authLoading || !user || !session) {
    return (
      <div className="min-h-screen bg-deep-onyx flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-cyber-yellow border-t-transparent rounded-full animate-spin" />
          <span className="text-white/40 text-sm font-bold uppercase tracking-widest">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-deep-onyx text-white flex overflow-hidden">
      <SidebarLeft currentPage="quizzes" />

      <main className="flex-1 flex flex-col relative z-0 min-w-0 h-screen overflow-hidden">
        {/* Hero Section */}
        <div className="min-h-[40vh] bg-cyber-yellow text-black p-12 liquid-wave relative overflow-hidden flex flex-col justify-end">
          <div className="absolute top-10 right-10 flex gap-4">
            <div className="bg-black text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">{session.title}</div>
          </div>
          <div className="max-w-3xl mb-12">
            <p className="text-sm font-bold uppercase tracking-[0.3em] mb-4 opacity-70">Mastery Challenge</p>
            <h1 className="text-7xl font-bold tracking-tighter leading-tight mb-4">
              {view === "taking" ? "Quiz in Progress" : view === "results" ? "Quiz Results" : "Quiz Your Knowledge"}
            </h1>
            <p className="text-xl font-medium opacity-80">
              {view === "taking"
                ? `Question ${currentQuestion + 1} of ${activeQuiz?.questions.length || 0}`
                : view === "results"
                  ? `You scored ${score}%`
                  : "AI-generated quizzes from your study modules."}
            </p>
          </div>
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-black/5 rounded-full -mb-40 -mr-20" />
        </div>

        {/* Content Layer */}
        <div className="flex-1 px-12 pb-20 overflow-y-auto relative z-10">
          {view === "list" && (
            <div className="space-y-8 pt-8">
              {/* Stats */}
              <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="glass-card p-6 rounded-[32px] flex flex-col justify-center">
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Total Quizzes</p>
                  <p className="text-3xl font-bold">{quizzes.length}</p>
                </div>
                <div className="glass-card p-6 rounded-[32px] flex flex-col justify-center">
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Completed</p>
                  <p className="text-3xl font-bold">{completedQuizzes.length}</p>
                </div>
                <div className="glass-card p-6 rounded-[32px] flex flex-col justify-center">
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Avg. Score</p>
                  <p className="text-3xl font-bold">{avgScore}%</p>
                </div>
                <div className="glass-card p-6 rounded-[32px] flex flex-col justify-center">
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Modules</p>
                  <p className="text-3xl font-bold">{modules.length}</p>
                </div>
              </div>

              {/* Generate New Quiz */}
              <div className="glass-card rounded-[32px] p-8">
                <h3 className="text-lg font-bold mb-4">Generate New Quiz</h3>
                <p className="text-sm text-white/40 mb-4">Select a module or generate a general quiz on the subject.</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <button
                    onClick={() => setSelectedModule("")}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      !selectedModule ? "bg-cyber-yellow text-black" : "bg-white/5 text-white/60 hover:bg-white/10"
                    }`}
                  >
                    General Quiz
                  </button>
                  {modules.map((mod) => (
                    <button
                      key={mod.id}
                      onClick={() => setSelectedModule(mod.id)}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        selectedModule === mod.id ? "bg-cyber-yellow text-black" : "bg-white/5 text-white/60 hover:bg-white/10"
                      }`}
                    >
                      {mod.title}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => handleGenerateQuiz()}
                  disabled={generating}
                  className="bg-cyber-yellow text-black px-8 py-3 rounded-full text-sm font-black uppercase hover:scale-105 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {generating ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      Generating...
                    </span>
                  ) : (
                    "Generate Quiz"
                  )}
                </button>
              </div>

              {/* Quiz List */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-white/40 mb-6">Your Quizzes</h3>
                {quizzes.length === 0 ? (
                  <div className="text-center py-16 glass-card rounded-[32px]">
                    <p className="text-white/30 text-sm">No quizzes yet. Generate your first one above!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-6">
                    {quizzes.map((quiz) => {
                      const moduleTitle = modules.find((m) => m.id === quiz.module_id)?.title || "General";
                      return (
                        <div key={quiz.id} className="glass-card p-6 rounded-[32px] group hover:border-cyber-yellow/20 transition-all">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <span className="px-3 py-1 bg-white/5 text-white/60 text-[10px] font-black uppercase rounded-full">{moduleTitle}</span>
                              <h4 className="text-lg font-bold mt-2">{quiz.title}</h4>
                            </div>
                            {quiz.completed && quiz.score !== null && (
                              <div className={`text-2xl font-black ${
                                quiz.score >= 80 ? "text-green-400" : quiz.score >= 50 ? "text-yellow-400" : "text-red-400"
                              }`}>
                                {quiz.score}%
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-white/40 mb-4">
                            <span>{quiz.total_questions} questions</span>
                            <span>{quiz.completed ? "Completed" : "Not started"}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => startQuiz(quiz)}
                              className="flex-1 bg-cyber-yellow text-black font-bold py-3 rounded-full text-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
                            >
                              {quiz.completed ? "Retake Quiz" : "Start Quiz"}
                            </button>
                            <button
                              onClick={() => deleteQuiz(quiz.id)}
                              className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-red-400/10 hover:text-red-400 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {view === "taking" && activeQuiz && (
            <div className="max-w-3xl mx-auto py-8 space-y-8">
              {/* Progress bar */}
              <div className="glass-card rounded-full p-2 flex items-center gap-4">
                <button onClick={goToList} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 cursor-pointer">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>
                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyber-yellow rounded-full transition-all"
                    style={{ width: `${((currentQuestion + 1) / activeQuiz.questions.length) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-white/40">{currentQuestion + 1}/{activeQuiz.questions.length}</span>
              </div>

              {/* Question */}
              {activeQuiz.questions[currentQuestion] && (
                <div className="glass-card rounded-[32px] p-8">
                  <h2 className="text-xl font-bold mb-8">
                    {activeQuiz.questions[currentQuestion].question}
                  </h2>
                  <div className="space-y-3">
                    {activeQuiz.questions[currentQuestion].options.map((option, i) => {
                      const isSelected = selectedAnswers[currentQuestion] === i;
                      return (
                        <button
                          key={i}
                          onClick={() => selectAnswer(currentQuestion, i)}
                          className={`w-full text-left p-5 rounded-2xl border transition-all cursor-pointer ${
                            isSelected
                              ? "border-cyber-yellow bg-cyber-yellow/10"
                              : "border-white/10 hover:border-white/20 hover:bg-white/5"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                              isSelected ? "bg-cyber-yellow text-black" : "bg-white/5 text-white/40"
                            }`}>
                              {String.fromCharCode(65 + i)}
                            </div>
                            <span className="text-sm">{option}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setCurrentQuestion((p) => Math.max(0, p - 1))}
                  disabled={currentQuestion === 0}
                  className="px-6 py-3 rounded-full text-sm font-bold bg-white/5 hover:bg-white/10 transition-all disabled:opacity-30 cursor-pointer"
                >
                  Previous
                </button>
                {currentQuestion === activeQuiz.questions.length - 1 ? (
                  <button
                    onClick={submitQuiz}
                    disabled={selectedAnswers.includes(-1)}
                    className="bg-cyber-yellow text-black px-8 py-3 rounded-full text-sm font-black uppercase hover:scale-105 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    Submit Quiz
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentQuestion((p) => Math.min(activeQuiz.questions.length - 1, p + 1))}
                    className="bg-cyber-yellow text-black px-8 py-3 rounded-full text-sm font-black uppercase hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    Next
                  </button>
                )}
              </div>
            </div>
          )}

          {view === "results" && activeQuiz && (
            <div className="max-w-3xl mx-auto py-8 space-y-8">
              {/* Score card */}
              <div className="glass-card rounded-[32px] p-8 text-center">
                <div className={`text-8xl font-black mb-4 ${
                  (score || 0) >= 80 ? "text-green-400" : (score || 0) >= 50 ? "text-yellow-400" : "text-red-400"
                }`}>
                  {score}%
                </div>
                <p className="text-lg font-bold mb-2">
                  {(score || 0) >= 80 ? "Excellent work!" : (score || 0) >= 50 ? "Good effort!" : "Keep practicing!"}
                </p>
                <p className="text-sm text-white/40">
                  You got {activeQuiz.questions.filter((q: QuizQuestion, i: number) => selectedAnswers[i] === q.correct_index).length} out of {activeQuiz.questions.length} correct
                </p>
              </div>

              {/* Answer review */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-white/40">Review Answers</h3>
                {activeQuiz.questions.map((q: QuizQuestion, i: number) => {
                  const isCorrect = selectedAnswers[i] === q.correct_index;
                  return (
                    <div key={i} className="glass-card rounded-[24px] p-6">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="text-sm font-bold flex-1 mr-4">{q.question}</h4>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          isCorrect ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                        }`}>
                          {isCorrect ? "Correct" : "Wrong"}
                        </span>
                      </div>
                      <div className="space-y-1 mb-3">
                        {q.options.map((opt: string, oi: number) => (
                          <div key={oi} className={`text-xs px-3 py-2 rounded-lg ${
                            oi === q.correct_index
                              ? "bg-green-500/10 text-green-400 border border-green-500/20"
                              : oi === selectedAnswers[i]
                                ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                : "text-white/40"
                          }`}>
                            {String.fromCharCode(65 + oi)}. {opt}
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-white/50">{q.explanation}</p>
                    </div>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => { startQuiz(activeQuiz); setView("taking"); }}
                  className="flex-1 bg-white/5 border border-white/10 py-3 rounded-full text-sm font-bold hover:bg-white/10 transition-all cursor-pointer"
                >
                  Retake Quiz
                </button>
                <button
                  onClick={goToList}
                  className="flex-1 bg-cyber-yellow text-black py-3 rounded-full text-sm font-black uppercase hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  Back to Quizzes
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <SidebarRight />
    </div>
  );
}
