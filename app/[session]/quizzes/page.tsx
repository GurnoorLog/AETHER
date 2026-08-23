"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { use } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "../layout";
import type { QuizQuestion, SessionQuiz } from "@/types/database";

const GREEN = "#6B8E61";
const RED = "#C05050";

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
      <div className="h-full flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-sage/40 border-t-sage rounded-full animate-spin" />
      </div>
    );
  }

  const cardStyle = { backgroundColor: "#FFF", border: "1px solid #F3EDE3", boxShadow: "0 4px 14px rgba(0,0,0,0.03)" };

  return (
    <div className="h-screen overflow-y-auto px-4 sm:px-8 lg:px-16 py-10 lg:py-14" style={{ backgroundColor: "#FDFBF7" }}>
      <div className="max-w-4xl mx-auto">

        {/* ── TAKING ── */}
        {view === "taking" && activeQuiz && (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
              <h1 className="text-xl lg:text-2xl font-bold truncate" style={{ color: "#333" }}>{activeQuiz.title}</h1>
              <button
                onClick={goToList}
                className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-2 rounded-2xl shrink-0 cursor-pointer hover:brightness-95 transition-all"
                style={{ backgroundColor: "#F3EDE3", color: "#999", letterSpacing: "0.05em" }}
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="#999" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                EXIT
              </button>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#F3EDE3" }}>
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${(currentQuestion / activeQuiz.questions.length) * 100}%`, backgroundColor: GREEN }}
                />
              </div>
              <span className="text-xs font-bold" style={{ color: "#999" }}>{currentQuestion + 1} / {activeQuiz.questions.length}</span>
            </div>

            {/* Question card */}
            <div className="rounded-[20px] p-5 lg:p-7" style={cardStyle}>
              <p className="text-[10px] font-bold uppercase mb-2" style={{ color: GREEN, letterSpacing: "0.12em" }}>
                QUESTION {currentQuestion + 1} OF {activeQuiz.questions.length}
              </p>
              <h2 className="text-lg lg:text-xl font-semibold leading-relaxed" style={{ color: "#333" }}>
                {activeQuiz.questions[currentQuestion]?.question}
              </h2>
            </div>

            {/* Answers */}
            <div className="space-y-2.5">
              {activeQuiz.questions[currentQuestion]?.options.map((opt, i) => {
                const selected = selectedAnswers[currentQuestion] === i;
                return (
                  <button
                    key={i}
                    onClick={() => selectAnswer(currentQuestion, i)}
                    className="w-full flex items-center gap-3 text-left p-4 rounded-[20px] transition-all cursor-pointer"
                    style={{
                      backgroundColor: selected ? "#FBFCF9" : "#FFF",
                      border: selected ? `1.5px solid ${GREEN}` : "1px solid #F3EDE3",
                      boxShadow: "0 4px 14px rgba(0,0,0,0.03)",
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0"
                      style={{ backgroundColor: selected ? GREEN : "#F3EDE3", color: selected ? "#FFF" : "#999" }}
                    >
                      {String.fromCharCode(65 + i)}
                    </div>
                    <span className={`flex-1 text-sm ${selected ? "font-semibold" : ""}`} style={{ color: selected ? "#333" : "#666" }}>{opt}</span>
                    {selected && (
                      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke={GREEN} strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Nav */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <button
                onClick={() => setCurrentQuestion((p) => Math.max(0, p - 1))}
                disabled={currentQuestion === 0}
                className="px-5 py-3 rounded-full text-sm font-semibold transition-all disabled:opacity-30 cursor-pointer"
                style={{ backgroundColor: "#F3EDE3", color: "#666" }}
              >
                Previous
              </button>
              <button
                onClick={() =>
                  currentQuestion < activeQuiz.questions.length - 1
                    ? setCurrentQuestion((c) => c + 1)
                    : submitQuiz()
                }
                disabled={selectedAnswers[currentQuestion] === -1}
                className="text-white text-xs font-bold py-3.5 px-8 rounded-full transition-all cursor-pointer disabled:opacity-40 hover:brightness-105 active:scale-[0.98]"
                style={{ backgroundColor: GREEN, letterSpacing: "0.08em" }}
              >
                {currentQuestion === activeQuiz.questions.length - 1 ? "SUBMIT QUIZ" : "NEXT QUESTION"}
              </button>
            </div>
          </div>
        )}

        {/* ── RESULTS ── */}
        {view === "results" && activeQuiz && (
          <div className="space-y-5">
            <div className="flex flex-col items-center py-6">
              <div
                className="w-[130px] h-[130px] rounded-full bg-white flex items-center justify-center mb-4"
                style={{ borderWidth: 6, borderStyle: "solid", borderColor: (score ?? 0) >= 70 ? GREEN : RED, boxShadow: "0 8px 24px rgba(0,0,0,0.04)" }}
              >
                <span className="text-4xl font-extrabold" style={{ color: (score ?? 0) >= 70 ? GREEN : RED }}>{score}%</span>
              </div>
              <h1 className="text-xl font-bold" style={{ color: "#333" }}>
                {(score ?? 0) >= 70 ? "Great work!" : "Keep practicing!"}
              </h1>
              <p className="text-sm mt-1" style={{ color: "#999" }}>
                You got {activeQuiz.questions.filter((q: QuizQuestion, i: number) => selectedAnswers[i] === q.correct_index).length} of {activeQuiz.questions.length} correct.
              </p>
            </div>

            {/* Review */}
            <div className="space-y-3">
              {activeQuiz.questions.map((q: QuizQuestion, qi: number) => {
                const correct = selectedAnswers[qi] === q.correct_index;
                const picked = selectedAnswers[qi];
                return (
                  <div key={qi} className="rounded-[20px] p-5 space-y-2" style={cardStyle}>
                    <p className="text-[13px] font-bold leading-snug" style={{ color: "#333" }}>{qi + 1}. {q.question}</p>
                    <div className="flex items-center gap-1.5">
                      {correct ? (
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke={GREEN} strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                      ) : (
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke={RED} strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      )}
                      <span className="text-xs font-semibold" style={{ color: correct ? GREEN : RED }}>
                        {correct ? "Correct" : `Correct answer: ${q.options[q.correct_index]}`}
                      </span>
                    </div>
                    {!correct && picked >= 0 && (
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke={RED} strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                        <span className="text-xs font-semibold" style={{ color: RED }}>Your pick: {q.options[picked]}</span>
                      </div>
                    )}
                    {q.explanation && <p className="text-xs leading-relaxed pt-1" style={{ color: "#999" }}>{q.explanation}</p>}
                  </div>
                );
              })}
            </div>

            <button
              onClick={goToList}
              className="w-full flex items-center justify-center gap-2 text-white text-xs font-bold py-4 rounded-full cursor-pointer hover:brightness-105 active:scale-[0.99] transition-all"
              style={{ backgroundColor: GREEN, letterSpacing: "0.08em" }}
            >
              BACK TO QUIZZES
            </button>
          </div>
        )}

        {/* ── LIST ── */}
        {view === "list" && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide mb-0.5" style={{ color: GREEN }}>Test Yourself</p>
                <h1 className="text-2xl lg:text-[28px] font-bold" style={{ color: "#333" }}>Quizzes</h1>
              </div>
              <button
                onClick={() => handleGenerateQuiz()}
                disabled={generating}
                className="flex items-center gap-1.5 text-white text-[11px] font-bold px-4 py-3 rounded-[20px] cursor-pointer transition-all disabled:opacity-55 hover:brightness-105 active:scale-[0.98]"
                style={{ backgroundColor: GREEN, letterSpacing: "0.05em" }}
              >
                {!generating && (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="#FFF" strokeWidth="2.2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                )}
                {generating ? "GENERATING..." : "GENERATE"}
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: "Total Quizzes", value: String(quizzes.length), fg: "#7C69A2", bg: "#F0EEFA" },
                { label: "Completed", value: String(completedQuizzes.length), fg: "#EAB308", bg: "#FFF5E6" },
                { label: "Avg. Score", value: `${avgScore}%`, fg: "#6366F1", bg: "#EBF1FF" },
                { label: "Modules", value: String(modules.length), fg: GREEN, bg: "#EBF7F2" },
              ].map((s) => (
                <div key={s.label} className="rounded-[20px] p-4" style={cardStyle}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2.5" style={{ backgroundColor: s.bg }}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={s.fg} strokeWidth="1.8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-6m2.25-9m-3.75 3.75h7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                  </div>
                  <p className="text-xl font-bold leading-none" style={{ color: s.fg }}>{s.value}</p>
                  <p className="text-[11px] font-medium mt-1.5" style={{ color: "#999" }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Module chips */}
            {modules.length > 0 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                <button
                  onClick={() => setSelectedModule("")}
                  className="shrink-0 text-xs font-bold px-3.5 py-2.5 rounded-full cursor-pointer transition-colors"
                  style={selectedModule === "" ? { backgroundColor: GREEN, color: "#FFF" } : { backgroundColor: "#F3EDE3", color: "#666" }}
                >
                  General
                </button>
                {modules.map((mod) => (
                  <button
                    key={mod.id}
                    onClick={() => setSelectedModule(mod.id)}
                    className="shrink-0 max-w-[200px] truncate text-xs font-bold px-3.5 py-2.5 rounded-full cursor-pointer transition-colors"
                    style={selectedModule === mod.id ? { backgroundColor: GREEN, color: "#FFF" } : { backgroundColor: "#F3EDE3", color: "#666" }}
                  >
                    {mod.title}
                  </button>
                ))}
              </div>
            )}

            {/* Quiz list */}
            {loading ? (
              <div className="rounded-[24px] p-8 text-center" style={cardStyle}>
                <p className="text-sm" style={{ color: "#999" }}>Loading quizzes...</p>
              </div>
            ) : quizzes.length === 0 ? (
              <div className="rounded-[24px] p-10 flex flex-col items-center text-center" style={cardStyle}>
                <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: "#F9F6F0" }}>
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="#CCC" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-6m2.25-9m-3.75 3.75h7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold mb-1" style={{ color: "#333" }}>No quizzes yet</h3>
                <p className="text-sm max-w-[280px]" style={{ color: "#999" }}>
                  Generate a quiz on a module (or general knowledge) to test yourself.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {quizzes.map((quiz) => {
                  const pct = quiz.total_questions > 0 ? Math.round(((quiz.score ?? 0) / quiz.total_questions) * 100) : 0;
                  return (
                    <div
                      key={quiz.id}
                      onClick={() => startQuiz(quiz)}
                      className="rounded-[20px] p-4 lg:p-5 cursor-pointer hover:shadow-md transition-shadow group"
                      style={cardStyle}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="flex-1 text-[15px] font-bold leading-snug" style={{ color: "#333" }}>{quiz.title}</h4>
                        {quiz.completed && (
                          <span
                            className="shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-xl"
                            style={{ backgroundColor: pct >= 70 ? "#E8F0E5" : "#F3E8E8", color: pct >= 70 ? GREEN : RED }}
                          >
                            {pct}%
                          </span>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteQuiz(quiz.id); }}
                          className="shrink-0 w-7 h-7 rounded-lg hidden lg:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 cursor-pointer"
                          aria-label="Delete quiz"
                        >
                          <svg className="w-3.5 h-3.5 text-warm-ink-faint hover:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                      <p className="text-xs mt-1" style={{ color: "#999" }}>
                        {quiz.total_questions} questions · {quiz.completed ? "Completed" : "Not taken"}
                      </p>
                      <div className="flex items-center justify-end gap-1.5 mt-3 pt-3" style={{ borderTop: "1px solid #F3EDE3" }}>
                        <svg className="w-3 h-3 shrink-0" fill={GREEN} viewBox="0 0 24 24">
                          <path d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653z" />
                        </svg>
                        <span className="text-[10px] font-bold" style={{ color: GREEN, letterSpacing: "0.05em" }}>
                          {quiz.completed ? "RETRY" : "START"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
