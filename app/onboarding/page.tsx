"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { completeOnboarding } from "@/lib/onboarding";
import AiMessage from "@/components/onboarding/AiMessage";
import PersonalizationLoading from "@/components/onboarding/PersonalizationLoading";
import PricingModal from "@/components/PricingModal";

const subjects = ["Mathematics", "Computer Science", "Biology", "Physics", "Medicine", "Engineering", "Languages", "History", "Psychology", "Economics"];

const edus = ["High School", "College", "University", "Graduate", "Self Learner"];

const learningStyles = [
  { id: "step_by_step", label: "Step-by-step explanations" },
  { id: "visual", label: "Visual diagrams" },
  { id: "real_world", label: "Real-world examples" },
  { id: "conversations", label: "Interactive conversations" },
  { id: "practice", label: "Practice questions" },
  { id: "summaries", label: "Short summaries" },
];

const goals = [
  "Pass exams",
  "Improve grades",
  "Learn a new subject",
  "Prepare for interviews",
  "Understand difficult concepts",
  "Build practical skills",
];

interface ConversationEntry {
  role: "ai" | "user";
  content: string;
  typingSpeed?: number;
}

export default function OnboardingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<"welcome" | "conversation" | "loading" | "done">("welcome");
  const [showPricing, setShowPricing] = useState(false);
  const [step, setStep] = useState(0);
  const [conversation, setConversation] = useState<ConversationEntry[]>([]);
  const [ud, setUd] = useState<Record<string, unknown>>({});

  const [name, setName] = useState("");
  const [subs, setSubs] = useState<string[]>([]);
  const [custom, setCustom] = useState("");
  const [edu, setEdu] = useState("");
  const [styles, setStyles] = useState<string[]>([]);
  const [gl, setGl] = useState<string[]>([]);
  const [voice, setVoice] = useState<boolean | null>(null);

  const [typed, setTyped] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [phase, conversation, typed, step]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/");
    }
  }, [user, authLoading, router]);

  const msgs = [
    {
      text: "Hello! I'm Aether, your personal AI tutor.\n\nI'll learn how you study, remember your progress, and help you master every subject. Before we begin, I'd like to get to know you.",
      key: "welcome",
    },
    { text: "What should I call you?", key: "name" },
    { text: "What are you studying right now?", key: "subjects" },
    { text: "What's your current education level?", key: "education" },
    { text: "How do you learn best?", key: "learning_style" },
    { text: "What would you like me to help you achieve?", key: "goals" },
    { text: "Would you like to study using voice conversations? I can talk naturally with you in real time.", key: "voice" },
  ];

  const onWelcome = useCallback(() => {
    setTimeout(() => {
      setPhase("conversation");
      setStep(1);
      setConversation([{ role: "ai", content: msgs[1].text }]);
    }, 600);
  }, []);

  const sayUser = useCallback((text: string) => {
    setConversation((prev) => [...prev, { role: "user", content: text }]);
  }, []);

  const stepFwd = useCallback((nextStepIndex: number) => {
    if (nextStepIndex < msgs.length) {
      setConversation((prev) => [...prev, { role: "ai", content: msgs[nextStepIndex].text }]);
      setStep(nextStepIndex);
      setTyped(false);
    }
  }, []);

  const nameDone = useCallback(() => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setUd((prev) => ({ ...prev, name: trimmed }));
    sayUser(trimmed);
    setName("");
    setTimeout(() => stepFwd(2), 400);
  }, [name, sayUser, stepFwd]);

  const subsDone = useCallback(() => {
    const all = [...subs];
    if (custom.trim()) all.push(custom.trim());
    if (all.length === 0) return;
    setUd((prev) => ({ ...prev, subjects: all }));
    sayUser(all.join(", "));
    setSubs([]);
    setCustom("");
    setTimeout(() => stepFwd(3), 400);
  }, [subs, custom, sayUser, stepFwd]);

  const eduDone = useCallback(() => {
    if (!edu) return;
    setUd((prev) => ({ ...prev, education: edu }));
    sayUser(edu);
    setEdu("");
    setTimeout(() => stepFwd(4), 400);
  }, [edu, sayUser, stepFwd]);

  const stylesDone = useCallback(() => {
    if (styles.length === 0) return;
    const labels: string[] = [];
    for (const id of styles) {
      const found = learningStyles.find((s) => s.id === id);
      labels.push(found?.label || id);
    }
    setUd((prev) => ({ ...prev, learningStyles: styles }));
    sayUser(labels.join(", "));
    setStyles([]);
    setTimeout(() => stepFwd(5), 400);
  }, [styles, sayUser, stepFwd]);

  const goalsDone = useCallback(() => {
    if (gl.length === 0) return;
    setUd((prev) => ({ ...prev, goals: gl }));
    sayUser(gl.join(", "));
    setGl([]);
    setTimeout(() => stepFwd(6), 400);
  }, [gl, sayUser, stepFwd]);

  const voiceDone = useCallback((pref: boolean) => {
    setVoice(pref);
    setUd((prev) => ({ ...prev, voiceEnabled: pref }));
    sayUser(pref ? "Yes, voice sounds great!" : "No, I prefer text.");
    setTimeout(() => setPhase("loading"), 600);
  }, [sayUser]);

  const personalized = useCallback(async () => {
    if (!user) return;

    try {
      const preferences = {
        subjects: ud.subjects,
        education_level: ud.education,
        learning_style: ud.learningStyles,
        goals: ud.goals,
        voice_enabled: voice,
      };

      const out = await completeOnboarding({
        userId: user.id,
        fullName: (ud.name as string) || user.user_metadata?.full_name || "Student",
        email: user.email || "",
        subjects: (ud.subjects as string[]) || [],
        preferences,
      });

      if (out.error) {
        console.error("Onboarding failed:", out.error);
      }

      setPhase("done");
      setShowPricing(true);
    } catch (err) {
      console.error("Onboarding error:", err);
      router.push("/hub");
    }
  }, [user, ud, voice, router]);

  const flipSubj = (s: string) => {
    setSubs((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };
  const flipStyle = (id: string) => {
    setStyles((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };
  const flipGoal = (g: string) => {
    setGl((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-[#FBF7F0] flex items-center justify-center relative">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-[#3F5C3A] animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-[#555E61] text-sm font-semibold uppercase tracking-[0.18em]">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {phase === "welcome" && (
        <div className="min-h-screen bg-[#FBF7F0] flex flex-col items-center justify-center px-4 sm:px-8 relative">
          <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-full bg-[#3F5C3A] flex items-center justify-center mb-10 sm:mb-12 lg:mb-14 border-2 border-[#2D3436] shadow-[4px_4px_0_0_#2D3436] relative z-10">
            <span className="serif-display text-white text-4xl sm:text-5xl font-semibold">A</span>
          </div>

          <div className="max-w-lg text-center relative z-10">
              <div className="text-xl md:text-2xl text-[#2D3436] font-medium leading-relaxed min-h-[3em]">
              <AiMessage
                text="Hello! I'm Aether, your personal AI tutor. I'll learn how you study, remember your progress, and help you master every subject. Before we begin, I'd like to get to know you."
                typingSpeed={22}
                showAvatar={false}
                onTypingComplete={onWelcome}
              />
            </div>
          </div>
        </div>
      )}

      {phase === "conversation" && (
        <div className="min-h-screen bg-[#FBF7F0] flex flex-col relative">
          <div className="sticky top-0 z-20 px-4 sm:px-6 lg:px-8 py-4 lg:py-6 flex items-center justify-between bg-[#FBF7F0]/90 backdrop-blur border-b border-[#E7E1D6]">
            <div className="flex items-center gap-3">
              <div>
                <span className="text-sm font-bold tracking-tight text-[#2D3436]">AETHER</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#3F5C3A] animate-pulse" />
                  <span className="text-[10px] font-bold text-[#A0A5A8] uppercase tracking-[0.18em]">Online</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {msgs.slice(1, 7).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all duration-500 ${
                    i < step - 1 ? "bg-[#3F5C3A]" : i === step - 1 ? "bg-[#3F5C3A]/70 w-4" : "bg-[#E7E1D6]"
                  }`}
                />
              ))}
            </div>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 md:px-12 py-10">
            <div className="max-w-3xl mx-auto space-y-10">
              {conversation.map((entry, i) =>
                entry.role === "ai" ? (
                  <AiMessage
                    key={i}
                    text={entry.content}
                    typingSpeed={entry.typingSpeed || 25}
                    startDelay={i === conversation.length - 1 && i > 0 ? 300 : 0}
                    onTypingComplete={i === conversation.length - 1 ? () => setTyped(true) : undefined}
                  />
                ) : (
                  <div
                    key={i}
                    className="flex justify-end"
                    style={{ animation: "fadeIn 0.5s cubic-bezier(0.16, 1, 0.24, 1)" }}
                  >
                    <div className="bg-white p-5 rounded-3xl rounded-tr-none max-w-[80%] editorial">
                      <p className="text-[#2D3436] font-medium">{entry.content}</p>
                    </div>
                  </div>
                )
              )}
              {typed && step < 7 && (
                <div
                  className="pt-4"
                  style={{ animation: "fadeIn 0.4s cubic-bezier(0.16, 1, 0.24, 1)" }}
                >
                  {step === 1 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <input
                          autoFocus
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && nameDone()}
                          placeholder="Type your name..."
                          className="flex-1 bg-white px-4 sm:px-6 py-4 sm:py-5             rounded-2xl text-[#2D3436] text-base sm:text-lg font-medium
                            placeholder:text-[#A0A5A8] border-[#E7E1D6] focus:border-[#3F5C3A]
                            outline-none focus:ring-2 focus:ring-[#3F5C3A]/20 ease-smooth editorial"
                        />
                        <button
                          onClick={nameDone}
                          disabled={!name.trim()}
                          className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#3F5C3A] flex items-center justify-center
                            hover:scale-105 active:scale-95 ease-smooth
                            disabled:opacity-30 cursor-pointer editorial"
                        >
                          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                  {step === 2 && (
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2 sm:gap-3">
                        {subjects.map((s) => (
                          <button
                            key={s}
                            onClick={() => flipSubj(s)}
                            className={`px-4 sm:px-5 py-3 rounded-2xl text-sm font-bold ease-smooth cursor-pointer ${
                              subs.includes(s)
                                ? "btn-editorial "
                                : "bg-white border border-[#E7E1D6] text-[#2D3436]/80 hover:border-[#3F5C3A]/50 hover:text-[#2D3436]"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          value={custom}
                          onChange={(e) => setCustom(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && subsDone()}
                          placeholder="Or type your own..."
                          className="editorial-input flex-1 px-4 sm:px-5 py-3 sm:py-4 text-sm font-medium"
                        />
                      </div>
                      {(subs.length > 0 || custom.trim()) && (
                        <button
                          onClick={subsDone}
                          className="px-6 sm:px-8 py-3 sm:py-4 btn-editorial text-sm font-bold
                            hover:scale-[1.02] active:scale-95 ease-smooth cursor-pointer"
                        >
                          Continue
                        </button>
                      )}
                    </div>
                  )}
                  {step === 3 && (
                    <div className="space-y-3">
                      {edus.map((level) => (
                        <button
                          key={level}
                          onClick={() => setEdu(level)}
                          className={`w-full text-left px-4 sm:px-6 py-3 sm:py-4 rounded-2xl text-sm sm:text-base font-bold ease-smooth cursor-pointer ${
                            edu === level
                              ? "btn-editorial "
                              : "bg-white border border-[#E7E1D6] text-[#2D3436]/80 hover:border-[#3F5C3A]/50 hover:text-[#2D3436]"
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                      {edu && (
                        <button
                          onClick={eduDone}
                          className="mt-3 px-6 sm:px-8 py-3 sm:py-4 btn-editorial text-sm font-bold
                            hover:scale-[1.02] active:scale-95 ease-smooth cursor-pointer"
                        >
                          Continue
                        </button>
                      )}
                    </div>
                  )}
                  {step === 4 && (
                    <div className="space-y-3">
                      {learningStyles.map((style) => (
                        <button
                          key={style.id}
                          onClick={() => flipStyle(style.id)}
                          className={`w-full text-left px-4 sm:px-6 py-3 sm:py-4 rounded-2xl text-sm sm:text-base font-bold ease-smooth cursor-pointer ${
                            styles.includes(style.id)
                              ? "btn-editorial "
                              : "bg-white border border-[#E7E1D6] text-[#2D3436]/80 hover:border-[#3F5C3A]/50 hover:text-[#2D3436]"
                          }`}
                        >
                          {style.label}
                        </button>
                      ))}
                      {styles.length > 0 && (
                        <button
                          onClick={stylesDone}
                          className="mt-3 px-6 sm:px-8 py-3 sm:py-4 btn-editorial text-sm font-bold
                            hover:scale-[1.02] active:scale-95 ease-smooth cursor-pointer"
                        >
                          Continue
                        </button>
                      )}
                    </div>
                  )}
                  {step === 5 && (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2 sm:gap-3">
                        {goals.map((g) => (
                          <button
                            key={g}
                            onClick={() => flipGoal(g)}
                            className={`px-4 sm:px-5 py-3 rounded-2xl text-sm font-bold ease-smooth cursor-pointer ${
                              gl.includes(g)
                                ? "btn-editorial "
                                : "bg-white border border-[#E7E1D6] text-[#2D3436]/80 hover:border-[#3F5C3A]/50 hover:text-[#2D3436]"
                            }`}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                      {gl.length > 0 && (
                        <button
                          onClick={goalsDone}
                          className="mt-3 px-6 sm:px-8 py-3 sm:py-4 btn-editorial text-sm font-bold
                            hover:scale-[1.02] active:scale-95 ease-smooth cursor-pointer"
                        >
                          Continue
                        </button>
                      )}
                    </div>
                  )}
                  {step === 6 && (
                    <div className="flex flex-col sm:flex-row gap-4">
                      <button
                        onClick={() => voiceDone(true)}
                        className="flex-1 bg-white p-4 sm:p-6 rounded-3xl border border-[#E7E1D6] hover:border-[#3F5C3A]/50
                          hover:bg-[#3F5C3A]/5 ease-smooth group cursor-pointer text-left editorial"
                      >
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#3F5C3A]/10 flex items-center justify-center mb-4 group-hover:scale-110 ease-smooth editorial">
                          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#3F5C3A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                            <path d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                          </svg>
                        </div>
                        <p className="text-base sm:text-lg font-bold text-[#2D3436] mb-1">Yes, enable voice</p>
                        <p className="text-sm text-[#555E61] font-medium">Natural voice conversations with real-time AI</p>
                      </button>
                      <button
                        onClick={() => voiceDone(false)}
                        className="flex-1 bg-white p-4 sm:p-6 rounded-3xl border border-[#E7E1D6] hover:border-[#3F5C3A]/50 hover:bg-[#3F5C3A]/5
                          ease-smooth group cursor-pointer text-left editorial"
                      >
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#2D3436]/5 flex items-center justify-center mb-4 group-hover:scale-110 ease-smooth editorial">
                          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#555E61]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                            <path d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                          </svg>
                        </div>
                        <p className="text-base sm:text-lg font-bold text-[#2D3436] mb-1">Text only</p>
                        <p className="text-sm text-[#555E61] font-medium">I prefer typing my questions</p>
                      </button>
                    </div>
                  )}
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>
          {typed && step === 1 && !name && (
            <div className="px-4 sm:px-6 lg:px-12 pb-6 text-center">
              <p className="text-xs text-[#A0A5A8] font-bold uppercase tracking-[0.18em]">Press Enter to send</p>
            </div>
          )}
        </div>
      )}

      {phase === "loading" && (
        <PersonalizationLoading onComplete={personalized} />
      )}

      {phase === "done" && (
        <div className="min-h-screen bg-[#FBF7F0] flex items-center justify-center">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-[#3F5C3A] animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        </div>
      )}

      {showPricing && <PricingModal onClose={() => router.push("/hub")} />}
    </>
  );
}