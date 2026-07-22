"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import SidebarRight from "@/components/SidebarRight";
import SidebarLeft from "@/components/SidebarLeft";

const SUBJECTS = [
  { name: "Mathematics", icon: "function-square", desc: "Calculus, Algebra, & Statistics" },
  { name: "Physics", icon: "atom", desc: "Mechanics, Quantum, & Optics" },
  { name: "Biology", icon: "dna", desc: "Genetics, Evolution, & Ecology" },
  { name: "Chemistry", icon: "beaker", desc: "Organic, Inorganic, & Energy" },
  { name: "History", icon: "landmark", desc: "Global Eras & Civilization" },
  { name: "Literature", icon: "book-open", desc: "Analysis & Creative Writing" },
  { name: "Languages", icon: "languages", desc: "Linguistics & Vocabulary" },
  { name: "Comp. Sci.", icon: "terminal", desc: "Algorithms & Architecture" },
];

const MODES = ["Interactive", "Lecture", "Practice"];
const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];
const DURATIONS = ["30m", "60m", "90m", "Custom"];

export default function StudyPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [selectedSubject, setSelectedSubject] = useState(1);
  const [learningMode, setLearningMode] = useState(0);
  const [difficulty, setDifficulty] = useState(1);
  const [duration, setDuration] = useState(1);
  const [objectives, setObjectives] = useState("");
  const [masteryPercentage] = useState(72);
  const [studyHours] = useState(4.2);
  const [newXP] = useState(850);
  const [firstFileProgress] = useState(50);
  const [isMusicPlaying, setIsMusicPlaying] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/");
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
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
    <div className="min-h-screen bg-deep-onyx text-white flex overflow-hidden">

      <SidebarLeft currentPage="docs" />

      {/* Center Workspace */}
      <main className="flex-1 flex flex-col relative z-0 min-w-0">

        {/* Hero Section */}
        <div className="h-[40vh] min-h-[350px] bg-cyber-yellow text-black p-12 liquid-wave relative overflow-hidden flex flex-col justify-end">
          <div className="absolute top-10 right-10 flex gap-4">
            <div className="bg-black text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">SYSTEM READY</div>
            <div className="bg-black/10 border border-black/10 backdrop-blur-md px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">Session Setup</div>
          </div>
          <div className="max-w-4xl mb-8">
            <p className="text-sm font-bold uppercase tracking-[0.3em] mb-4 opacity-70">Aether Intelligent Tutoring</p>
            <h1 className="text-6xl font-bold tracking-tighter leading-tight mb-2">Start Your Learning Session</h1>
            <p className="text-lg font-medium opacity-80">Let&apos;s customize your study experience for maximum retention.</p>
          </div>
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-black/5 rounded-full -mb-64 -mr-32" />
        </div>

        {/* Content Layer */}
        <div className="flex-1 -mt-16 px-12 pb-24 space-y-12">

          {/* Section 1: Topic Selection */}
          <section className="space-y-6">
            <div className="flex items-end justify-between">
              <h2 className="text-2xl font-bold tracking-tight">What would you like to study today?</h2>
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Select Primary Domain</span>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {SUBJECTS.map((subject, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedSubject(i)}
                  className={`glass rounded-[32px] p-6 topic-card cursor-pointer hover:scale-105 transition-all group border-2 ${selectedSubject === i ? "border-cyber-yellow" : "border-transparent"}`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${selectedSubject === i ? "bg-cyber-yellow" : "bg-cyber-yellow/10 group-hover:bg-cyber-yellow"}`}>
                    {subject.icon === "function-square" && (
                      <svg className={`text-2xl w-6 h-6 ${selectedSubject === i ? "text-black" : "text-cyber-yellow group-hover:text-black"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
                      </svg>
                    )}
                    {subject.icon === "atom" && (
                      <svg className={`text-2xl w-6 h-6 ${selectedSubject === i ? "text-black" : "text-cyber-yellow group-hover:text-black"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        <path d="M12 12m-3 0a3 3 0 100 6 3 3 0 000-6z" />
                        <path d="M9.472 14.528a3 3 0 014.243 0" />
                      </svg>
                    )}
                    {subject.icon === "dna" && (
                      <svg className={`text-2xl w-6 h-6 ${selectedSubject === i ? "text-black" : "text-cyber-yellow group-hover:text-black"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path d="M12 3v3m0 0L9.5 7.5M12 6l2.5-1.5M12 21v-3m0 0l2.5 1.5M12 18l-2.5 1.5M12 6v6m0 0l3 3m-3-3l-3 3m6-12a6 6 0 010 12 6 6 0 010-12z" />
                      </svg>
                    )}
                    {subject.icon === "beaker" && (
                      <svg className={`text-2xl w-6 h-6 ${selectedSubject === i ? "text-black" : "text-cyber-yellow group-hover:text-black"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path d="M9.75 3.75v2.25m0 0v9.75a3 3 0 01-3 3h-1.5a3 3 0 01-3-3V6.625c0-.621.504-1.125 1.125-1.125h1.5c.621 0 1.125.504 1.125 1.125v2.25m0-2.25H9.75m0 0V11.25a3 3 0 01-3 3m0-3V6m0 0V3.75" />
                        <path d="M13.5 14.25v-3a3 3 0 013-3h1.5a.75.75 0 01.75.75v9.75a3 3 0 01-3 3h-1.5a3 3 0 01-3-3v-1.5m3-6.75l-2.25 4.5m0 0l-2.25 4.5m2.25-4.5h4.5m-4.5 0l-2.25-4.5m6 10.5l-2.25-4.5m-3.75-6l-2.25 4.5" />
                      </svg>
                    )}
                    {subject.icon === "landmark" && (
                      <svg className={`text-2xl w-6 h-6 ${selectedSubject === i ? "text-black" : "text-cyber-yellow group-hover:text-black"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
                      </svg>
                    )}
                    {subject.icon === "book-open" && (
                      <svg className={`text-2xl w-6 h-6 ${selectedSubject === i ? "text-black" : "text-cyber-yellow group-hover:text-black"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                      </svg>
                    )}
                    {subject.icon === "languages" && (
                      <svg className={`text-2xl w-6 h-6 ${selectedSubject === i ? "text-black" : "text-cyber-yellow group-hover:text-black"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path d="M6 6h.01M6 6h12M6 6v12m0-12h12m0 0v12m0-12h.01M18 18h.01M6 18h.01M3 12h18" />
                      </svg>
                    )}
                    {subject.icon === "terminal" && (
                      <svg className={`text-2xl w-6 h-6 ${selectedSubject === i ? "text-black" : "text-cyber-yellow group-hover:text-black"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path d="M6 6l4.5 4.5L6 15m6 3h6" />
                      </svg>
                    )}
                  </div>
                  <h3 className="font-bold mb-1">{subject.name}</h3>
                  <p className="text-[10px] text-white/40 leading-relaxed">{subject.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Section 2: Preferences & Objectives */}
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-8">
              <section className="space-y-4">
                <h2 className="text-xl font-bold">Customize Learning Style</h2>
                <div className="space-y-4">
                  <div className="glass rounded-2xl p-6">
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-4">Learning Mode</p>
                    <div className="flex gap-2">
                      {MODES.map((mode, i) => (
                        <button
                          key={mode}
                          onClick={() => setLearningMode(i)}
                          className={`flex-1 py-3 rounded-full text-xs font-bold transition-all cursor-pointer ${learningMode === i ? "bg-cyber-yellow text-black" : "bg-white/5 border border-white/10 text-white hover:bg-white/10"}`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="glass rounded-2xl p-6">
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-4">Difficulty Level</p>
                    <div className="flex gap-2">
                      {DIFFICULTIES.map((diff, i) => (
                        <button
                          key={diff}
                          onClick={() => setDifficulty(i)}
                          className={`flex-1 py-3 rounded-full text-xs font-bold transition-all cursor-pointer ${difficulty === i ? "bg-cyber-yellow text-black" : "bg-white/5 border border-white/10 text-white hover:bg-white/10"}`}
                        >
                          {diff}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="glass rounded-2xl p-6">
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-4">Duration</p>
                    <div className="grid grid-cols-4 gap-2">
                      {DURATIONS.map((dur, i) => (
                        <button
                          key={dur}
                          onClick={() => setDuration(i)}
                          className={`py-2 rounded-full text-[10px] font-bold transition-all cursor-pointer ${duration === i ? "bg-cyber-yellow text-black" : "bg-white/5 border border-white/10 text-white hover:bg-white/10"}`}
                        >
                          {dur}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            </div>
            <div className="space-y-8">
              <section className="space-y-4">
                <h2 className="text-xl font-bold">Learning Objectives</h2>
                <div className="glass rounded-[32px] p-8 space-y-6 h-full">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">What are we mastering today?</label>
                    <div className="relative">
                      <textarea
                        value={objectives}
                        onChange={(e) => setObjectives(e.target.value)}
                        placeholder="Explain specific concepts you want to focus on..."
                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-cyber-yellow/50 min-h-[120px] transition-colors"
                      />
                      <div className="absolute bottom-4 right-4 text-[10px] text-white/20">AI analysis active...</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Supplementary Materials</label>
                    <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:bg-white/5 transition-all cursor-pointer group">
                      <svg className="text-4xl w-10 h-10 text-white/20 mb-4 group-hover:text-cyber-yellow group-hover:scale-110 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                      </svg>
                      <p className="text-xs text-white/40">Drop PDFs, Slides, or Notes here</p>
                      <p className="text-[10px] text-white/20 mt-1">Aether will index them for context</p>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* Section 3: Tutor & Action */}
          <section className="grid grid-cols-2 gap-8 items-center">
            <div className="flex items-center gap-6 glass rounded-[32px] p-6 border-l-4 border-cyber-yellow">
              <div className="w-20 h-20 rounded-2xl bg-black flex items-center justify-center border-2 border-cyber-yellow floating">
                <svg className="text-4xl w-9 h-9 text-cyber-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-bold text-cyber-yellow uppercase tracking-widest mb-1">Your Personal Tutor</p>
                <h3 className="text-xl font-bold">Aether Core v4.2</h3>
                <div className="flex gap-2 mt-2">
                  <span className="bg-white/5 px-3 py-1 rounded-full text-[10px] text-white/40">Socratic Method</span>
                  <span className="bg-white/5 px-3 py-1 rounded-full text-[10px] text-white/40">Multi-modal</span>
                </div>
              </div>
              <div className="ml-auto text-right">
                <p className="text-[10px] text-white/40">Satisfaction Rate</p>
                <p className="text-lg font-bold">98.4%</p>
              </div>
            </div>
            <div className="flex gap-4">
              <button className="flex-1 bg-white/5 border border-white/10 text-white font-bold py-5 rounded-full hover:bg-white/10 hover:scale-105 active:scale-95 transition-all cursor-pointer">Save as Template</button>
              <button className="flex-[2] bg-cyber-yellow text-black font-bold py-5 rounded-full shadow-[0_0_30px_rgba(253,224,71,0.3)] hover:scale-105 active:scale-95 transition-all text-xl flex items-center justify-center gap-3 cursor-pointer">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                </svg>
                Start Learning Session
              </button>
            </div>
          </section>

        </div>

        {/* Bottom Ticker */}
        <div className="mt-auto p-12 border-t border-white/5 bg-black">
          <div className="flex items-center justify-between opacity-30 grayscale">
            <span className="text-[10px] font-bold tracking-widest">OPTIMIZED FOR DEEP LEARNING</span>
            <div className="flex gap-12">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
                </svg>
                <span className="font-bold tracking-tighter">OpenAI</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
                </svg>
                <span className="font-bold tracking-tighter">Notion</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path d="M8.25 9.75h4.5m0 0v4.5m0-4.5l-6 6m4.5-11.25A6.75 6.75 0 0121 12" />
                </svg>
                <span className="font-bold tracking-tighter">Figma</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
                </svg>
                <span className="font-bold tracking-tighter">Github</span>
              </div>
            </div>
          </div>
        </div>

      </main>

      <SidebarRight />

      {/* Global Background Orbs */}
      <div className="fixed inset-0 pointer-events-none z-[-1] opacity-20">
        <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-cyber-yellow/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-cyber-yellow/5 rounded-full blur-[100px]" />
      </div>

    </div>
  );
}
