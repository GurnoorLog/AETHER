"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import AiMessage from "@/components/onboarding/AiMessage";
import PersonalizationLoading from "@/components/onboarding/PersonalizationLoading";

const subjects = ["Mathematics", "Computer Science", "Biology", "Physics", "Medicine", "Engineering", "Languages", "History", "Psychology", "Economics"];

const educationLevels = ["High School", "College", "University", "Graduate", "Self Learner"];

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
  const [phase, setPhase] = useState<"welcome" | "conversation" | "loading" | "done">("welcome");
  const [stepIndex, setStepIndex] = useState(0);
  const [aiReady, setAiReady] = useState(false);
  const [conversation, setConversation] = useState<ConversationEntry[]>([]);
  const [userInputs, setUserInputs] = useState<Record<string, unknown>>({});

  // form states
  const [nameValue, setNameValue] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [customSubject, setCustomSubject] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [voicePreference, setVoicePreference] = useState<boolean | null>(null);

  // typing completion tracking
  const [typingDone, setTypingDone] = useState(false);

  // scroll to bottom when conversation updates
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation, aiReady]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/");
    }
  }, [user, authLoading, router]);

  // Step definitions: AI messages for each step
  const stepMessages = [
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

  // After welcome animation completes, start the conversation at step 1 (skip duplicate intro)
  const handleWelcomeComplete = useCallback(() => {
    setTimeout(() => {
      setPhase("conversation");
      setStepIndex(1);
      setConversation([{ role: "ai", content: stepMessages[1].text }]);
    }, 600);
  }, []);

  const addUserMessage = useCallback((text: string) => {
    setConversation((prev) => [...prev, { role: "user", content: text }]);
  }, []);

  const advanceStep = useCallback((nextStepIndex: number) => {
    if (nextStepIndex < stepMessages.length) {
      setConversation((prev) => [...prev, { role: "ai", content: stepMessages[nextStepIndex].text }]);
      setStepIndex(nextStepIndex);
      setTypingDone(false);
    }
  }, []);

  const handleNameSubmit = useCallback(() => {
    const trimmed = nameValue.trim();
    if (!trimmed) return;
    setUserInputs((prev) => ({ ...prev, name: trimmed }));
    addUserMessage(trimmed);
    setNameValue("");
    setTimeout(() => advanceStep(2), 400);
  }, [nameValue, addUserMessage, advanceStep]);

  const handleSubjectsSubmit = useCallback(() => {
    const all = [...selectedSubjects];
    if (customSubject.trim()) all.push(customSubject.trim());
    if (all.length === 0) return;
    setUserInputs((prev) => ({ ...prev, subjects: all }));
    addUserMessage(all.join(", "));
    setSelectedSubjects([]);
    setCustomSubject("");
    setTimeout(() => advanceStep(3), 400);
  }, [selectedSubjects, customSubject, addUserMessage, advanceStep]);

  const handleEducationSubmit = useCallback(() => {
    if (!educationLevel) return;
    setUserInputs((prev) => ({ ...prev, education: educationLevel }));
    addUserMessage(educationLevel);
    setEducationLevel("");
    setTimeout(() => advanceStep(4), 400);
  }, [educationLevel, addUserMessage, advanceStep]);

  const handleStylesSubmit = useCallback(() => {
    if (selectedStyles.length === 0) return;
    const labels = selectedStyles.map((id) => learningStyles.find((s) => s.id === id)?.label || id);
    setUserInputs((prev) => ({ ...prev, learningStyles: selectedStyles }));
    addUserMessage(labels.join(", "));
    setSelectedStyles([]);
    setTimeout(() => advanceStep(5), 400);
  }, [selectedStyles, addUserMessage, advanceStep]);

  const handleGoalsSubmit = useCallback(() => {
    if (selectedGoals.length === 0) return;
    setUserInputs((prev) => ({ ...prev, goals: selectedGoals }));
    addUserMessage(selectedGoals.join(", "));
    setSelectedGoals([]);
    setTimeout(() => advanceStep(6), 400);
  }, [selectedGoals, addUserMessage, advanceStep]);

  const handleVoiceSubmit = useCallback((pref: boolean) => {
    setVoicePreference(pref);
    setUserInputs((prev) => ({ ...prev, voiceEnabled: pref }));
    addUserMessage(pref ? "Yes, voice sounds great!" : "No, I prefer text.");
    setTimeout(() => setPhase("loading"), 600);
  }, [addUserMessage]);

  const handlePersonalizationComplete = useCallback(async () => {
    if (!user) return;

    try {
      const supabase = createClient();
      const preferences = {
        ...userInputs,
        subjects: userInputs.subjects,
        educationLevel: userInputs.education,
        learningStyles: userInputs.learningStyles,
        goals: userInputs.goals,
        voiceEnabled: voicePreference,
      };

      await supabase
        .from("user_profiles")
        .update({
          onboarding_completed: true,
          preferences,
          full_name: (userInputs.name as string) || user.user_metadata?.full_name || "Student",
        })
        .eq("user_id", user.id);

      setPhase("done");
      router.push("/dashboard");
    } catch {
      router.push("/dashboard");
    }
  }, [user, userInputs, voicePreference, router]);

  // Toggle helpers
  const toggleSubject = (s: string) => {
    setSelectedSubjects((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };
  const toggleStyle = (id: string) => {
    setSelectedStyles((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };
  const toggleGoal = (g: string) => {
    setSelectedGoals((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-deep-onyx flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-cyber-yellow/[0.03] via-transparent to-transparent pointer-events-none" />
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-cyber-yellow animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-white/40 text-sm font-bold uppercase tracking-widest">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {phase === "welcome" && (
        <div className="min-h-screen bg-deep-onyx flex flex-col items-center justify-center px-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(253,224,71,0.08)_0%,_transparent_60%)] pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-cyber-yellow/[0.02] via-transparent to-deep-onyx pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,_rgba(253,224,71,0.04)_0%,_transparent_50%)] pointer-events-none" />

          {/* Subtle ambient grid */}
          <div
            className="absolute inset-0 opacity-[0.015] pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
              backgroundSize: '60px 60px',
            }}
          />

          {/* Floating particles */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full"
                style={{
                  left: `${5 + (i % 8) * 12}%`,
                  top: `${10 + Math.floor(i / 8) * 25}%`,
                  width: `${1.5 + (i % 4) * 2}px`,
                  height: `${1.5 + (i % 4) * 2}px`,
                  background: i % 3 === 0 ? 'rgba(253,224,71,0.4)' : i % 3 === 1 ? 'rgba(255,255,255,0.12)' : 'rgba(6,182,212,0.15)',
                  animation: `particleFloat ${9 + (i % 5) * 2}s ease-in-out infinite`,
                  animationDelay: `${i * 0.4}s`,
                  opacity: 0.15 + (i % 4) * 0.15,
                }}
              />
            ))}
          </div>

          {/* Glow behind avatar */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-cyber-yellow/5 blur-[120px] pointer-events-none" />

          <div className="w-28 h-28 rounded-[36px] bg-cyber-yellow/10 flex items-center justify-center mb-14 ring-1 ring-cyber-yellow/20 shadow-[0_0_80px_rgba(253,224,71,0.08)] relative z-10 avatar-breathing">
            <svg className="w-14 h-14 text-cyber-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>

          <div className="max-w-lg text-center relative z-10">
            <div className="text-xl md:text-2xl text-white/90 font-medium leading-relaxed min-h-[3em]">
              <AiMessage
                text="Hello! I'm Aether, your personal AI tutor. I'll learn how you study, remember your progress, and help you master every subject. Before we begin, I'd like to get to know you."
                typingSpeed={22}
                showAvatar={false}
                onTypingComplete={handleWelcomeComplete}
              />
            </div>
          </div>
        </div>
      )}

      {phase === "conversation" && (
        <div className="min-h-screen bg-deep-onyx flex flex-col relative">
          <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(253,224,71,0.03)_0%,_transparent_60%)] pointer-events-none" />
          <div className="fixed inset-0 bg-gradient-to-b from-cyber-yellow/[0.015] via-transparent to-transparent pointer-events-none" />
          <div
            className="fixed inset-0 opacity-[0.012] pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
              backgroundSize: '60px 60px',
            }}
          />
          {/* Header */}
          <div className="sticky top-0 z-20 px-8 py-6 flex items-center justify-between bg-deep-onyx/80 backdrop-blur-xl border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyber-yellow flex items-center justify-center shadow-lg shadow-cyber-yellow/10">
                <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <div>
                <span className="text-sm font-black tracking-tighter text-white">AETHER</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-success-green animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Online</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {stepMessages.slice(1, 7).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all duration-500 ${
                    i < stepIndex - 1 ? "bg-cyber-yellow shadow-[0_0_6px_rgba(253,224,71,0.4)]" : i === stepIndex - 1 ? "bg-cyber-yellow/60 shadow-[0_0_4px_rgba(253,224,71,0.2)] w-4" : "bg-white/10"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Conversation */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 md:px-12 py-10">
            <div className="max-w-3xl mx-auto space-y-10">
              {conversation.map((entry, i) =>
                entry.role === "ai" ? (
                  <AiMessage
                    key={i}
                    text={entry.content}
                    typingSpeed={entry.typingSpeed || 25}
                    startDelay={i === conversation.length - 1 && i > 0 ? 300 : 0}
                    onTypingComplete={i === conversation.length - 1 ? () => setTypingDone(true) : undefined}
                  />
                ) : (
                  <div
                    key={i}
                    className="flex justify-end"
                    style={{ animation: "fadeIn 0.5s cubic-bezier(0.16, 1, 0.24, 1)" }}
                  >
                    <div className="bg-white/10 border border-white/10 p-5 rounded-3xl rounded-tr-none max-w-[80%] shadow-lg">
                      <p className="text-white/90 font-medium">{entry.content}</p>
                    </div>
                  </div>
                )
              )}

              {/* Input area - shows after the last AI message finishes typing */}
              {typingDone && stepIndex < 7 && (
                <div
                  className="pt-4"
                  style={{ animation: "fadeIn 0.4s cubic-bezier(0.16, 1, 0.24, 1)" }}
                >
                  {/* Step 1: Name */}
                  {stepIndex === 1 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <input
                          autoFocus
                          type="text"
                          value={nameValue}
                          onChange={(e) => setNameValue(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleNameSubmit()}
                          placeholder="Type your name..."
                          className="flex-1 glass-card px-6 py-5 rounded-2xl text-white/90 text-lg font-medium
                            placeholder:text-white/20 border border-white/10 focus:border-cyber-yellow/40
                            outline-none focus:shadow-[0_0_30px_rgba(253,224,71,0.05)] premium-transition"
                        />
                        <button
                          onClick={handleNameSubmit}
                          disabled={!nameValue.trim()}
                          className="w-14 h-14 rounded-2xl bg-cyber-yellow flex items-center justify-center
                            hover:scale-105 active:scale-95 premium-transition shadow-xl shadow-cyber-yellow/10
                            disabled:opacity-30 cursor-pointer"
                        >
                          <svg className="w-6 h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Subjects */}
                  {stepIndex === 2 && (
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-3">
                        {subjects.map((s) => (
                          <button
                            key={s}
                            onClick={() => toggleSubject(s)}
                            className={`px-5 py-3 rounded-2xl text-sm font-bold premium-transition cursor-pointer ${
                              selectedSubjects.includes(s)
                                ? "bg-cyber-yellow text-black shadow-lg shadow-cyber-yellow/20"
                                : "bg-white/5 border border-white/10 text-white/60 hover:border-white/20 hover:text-white/80"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          value={customSubject}
                          onChange={(e) => setCustomSubject(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSubjectsSubmit()}
                          placeholder="Or type your own..."
                          className="flex-1 glass-card px-5 py-4 rounded-2xl text-white/70 text-sm font-medium
                            placeholder:text-white/20 border border-white/10 focus:border-cyber-yellow/40
                            outline-none premium-transition"
                        />
                      </div>
                      {(selectedSubjects.length > 0 || customSubject.trim()) && (
                        <button
                          onClick={handleSubjectsSubmit}
                          className="px-8 py-4 bg-cyber-yellow text-black rounded-2xl font-black text-sm
                            hover:scale-105 active:scale-95 premium-transition shadow-xl shadow-cyber-yellow/10 cursor-pointer"
                        >
                          Continue
                        </button>
                      )}
                    </div>
                  )}

                  {/* Step 3: Education */}
                  {stepIndex === 3 && (
                    <div className="space-y-3">
                      {educationLevels.map((level) => (
                        <button
                          key={level}
                          onClick={() => setEducationLevel(level)}
                          className={`w-full text-left px-6 py-4 rounded-2xl text-base font-bold premium-transition cursor-pointer ${
                            educationLevel === level
                              ? "bg-cyber-yellow text-black shadow-lg shadow-cyber-yellow/20"
                              : "bg-white/5 border border-white/10 text-white/60 hover:border-white/20 hover:text-white/80"
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                      {educationLevel && (
                        <button
                          onClick={handleEducationSubmit}
                          className="mt-3 px-8 py-4 bg-cyber-yellow text-black rounded-2xl font-black text-sm
                            hover:scale-105 active:scale-95 premium-transition shadow-xl shadow-cyber-yellow/10 cursor-pointer"
                        >
                          Continue
                        </button>
                      )}
                    </div>
                  )}

                  {/* Step 4: Learning Style */}
                  {stepIndex === 4 && (
                    <div className="space-y-3">
                      {learningStyles.map((style) => (
                        <button
                          key={style.id}
                          onClick={() => toggleStyle(style.id)}
                          className={`w-full text-left px-6 py-4 rounded-2xl text-base font-bold premium-transition cursor-pointer ${
                            selectedStyles.includes(style.id)
                              ? "bg-cyber-yellow text-black shadow-lg shadow-cyber-yellow/20"
                              : "bg-white/5 border border-white/10 text-white/60 hover:border-white/20 hover:text-white/80"
                          }`}
                        >
                          {style.label}
                        </button>
                      ))}
                      {selectedStyles.length > 0 && (
                        <button
                          onClick={handleStylesSubmit}
                          className="mt-3 px-8 py-4 bg-cyber-yellow text-black rounded-2xl font-black text-sm
                            hover:scale-105 active:scale-95 premium-transition shadow-xl shadow-cyber-yellow/10 cursor-pointer"
                        >
                          Continue
                        </button>
                      )}
                    </div>
                  )}

                  {/* Step 5: Goals */}
                  {stepIndex === 5 && (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-3">
                        {goals.map((g) => (
                          <button
                            key={g}
                            onClick={() => toggleGoal(g)}
                            className={`px-5 py-3 rounded-2xl text-sm font-bold premium-transition cursor-pointer ${
                              selectedGoals.includes(g)
                                ? "bg-cyber-yellow text-black shadow-lg shadow-cyber-yellow/20"
                                : "bg-white/5 border border-white/10 text-white/60 hover:border-white/20 hover:text-white/80"
                            }`}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                      {selectedGoals.length > 0 && (
                        <button
                          onClick={handleGoalsSubmit}
                          className="mt-3 px-8 py-4 bg-cyber-yellow text-black rounded-2xl font-black text-sm
                            hover:scale-105 active:scale-95 premium-transition shadow-xl shadow-cyber-yellow/10 cursor-pointer"
                        >
                          Continue
                        </button>
                      )}
                    </div>
                  )}

                  {/* Step 6: Voice */}
                  {stepIndex === 6 && (
                    <div className="flex gap-4">
                      <button
                        onClick={() => handleVoiceSubmit(true)}
                        className="flex-1 glass-card p-6 rounded-3xl border border-white/10 hover:border-cyber-yellow/40
                          hover:bg-cyber-yellow/5 premium-transition group cursor-pointer text-left"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-cyber-yellow/20 flex items-center justify-center mb-4 group-hover:scale-110 premium-transition">
                          <svg className="w-6 h-6 text-cyber-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                            <path d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                          </svg>
                        </div>
                        <p className="text-lg font-black text-white mb-1">Yes, enable voice</p>
                        <p className="text-sm text-white/40 font-medium">Natural voice conversations with real-time AI</p>
                      </button>
                      <button
                        onClick={() => handleVoiceSubmit(false)}
                        className="flex-1 glass-card p-6 rounded-3xl border border-white/10 hover:border-white/20
                          premium-transition group cursor-pointer text-left"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 premium-transition">
                          <svg className="w-6 h-6 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                            <path d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                          </svg>
                        </div>
                        <p className="text-lg font-black text-white mb-1">Text only</p>
                        <p className="text-sm text-white/40 font-medium">I prefer typing my questions</p>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Subtle hint */}
          {typingDone && stepIndex === 1 && !nameValue && (
            <div className="px-6 md:px-12 pb-6 text-center">
              <p className="text-xs text-white/20 font-bold uppercase tracking-widest">Press Enter to send</p>
            </div>
          )}
        </div>
      )}

      {phase === "loading" && (
        <PersonalizationLoading onComplete={handlePersonalizationComplete} />
      )}
    </>
  );
}
