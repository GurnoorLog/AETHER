"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import SidebarRight from "@/components/SidebarRight";
import SidebarLeft from "@/components/SidebarLeft";

export default function RoadmapPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [masteryPercentage, setMasteryPercentage] = useState(72);
  const [studyHours] = useState(4.2);
  const [newXP] = useState(850);
  const [firstFileProgress, setFirstFileProgress] = useState(50);
  const [isMusicPlaying, setIsMusicPlaying] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!authLoading && user) {
      const t = setInterval(() => {
        setMasteryPercentage((p) => Math.min(100, p + 0.5));
        setFirstFileProgress((p) => Math.min(100, p + 0.3));
      }, 2000);
      return () => clearInterval(t);
    }
  }, [authLoading, user]);

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

      <SidebarLeft currentPage="roadmap" />

      {/* Center Workspace */}
      <main className="flex-1 flex flex-col relative z-0 min-w-0 overflow-hidden">

        {/* Hero Section */}
        <div className="h-[40vh] bg-cyber-yellow text-black p-12 liquid-wave relative overflow-hidden flex flex-col justify-end">
          <div className="absolute top-10 right-10 flex gap-4">
            <div className="bg-black text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-xl">Focus: SAT Prep</div>
          </div>
          <div className="max-w-3xl mb-8">
            <p className="text-sm font-bold uppercase tracking-[0.3em] mb-4 opacity-70">Mastery Path</p>
            <h1 className="text-7xl font-bold tracking-tighter leading-tight mb-4">Your Learning Roadmap</h1>
            <div className="flex items-center gap-6 mt-6">
              <div className="flex-1 h-3 bg-black/10 rounded-full overflow-hidden">
                <div className="h-full bg-black w-[65%] rounded-full" />
              </div>
              <span className="text-2xl font-black tracking-tighter">65%</span>
            </div>
          </div>
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-black/5 rounded-full -mb-40 -mr-20 animate-pulse" />
        </div>

        {/* Content Layer */}
        <div className="flex-1 -mt-16 px-12 pb-24 overflow-y-auto space-y-12">

          {/* Exam Hub */}
          <section>
            <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-white/40 mb-6">Exam Hub</h2>
            <div className="grid grid-cols-3 gap-6">

              {/* Exam 1: SAT Prep (Active) */}
              <div className="glass-card rounded-[32px] p-8 border-2 border-cyber-yellow shadow-[0_0_40px_rgba(253,224,71,0.15)] relative overflow-hidden group hover:scale-[1.02] transition-all cursor-pointer">
                <div className="absolute top-0 right-0 bg-cyber-yellow text-black px-4 py-1 rounded-bl-2xl text-[10px] font-bold uppercase tracking-widest">Active</div>
                <h3 className="text-2xl font-bold mb-1">SAT Prep</h3>
                <p className="text-white/40 text-xs mb-6">College Board Mastery</p>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span>Completion</span>
                    <span>65%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-cyber-yellow w-[65%]" />
                  </div>
                  <div className="flex items-center gap-2 text-cyber-yellow">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      <path d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" />
                    </svg>
                    <span className="text-xs font-bold">Next: Quadratic Equations</span>
                  </div>
                </div>
              </div>

              {/* Exam 2: AP Calculus */}
              <div className="glass-card rounded-[32px] p-8 opacity-60 hover:opacity-100 border border-white/5 transition-all cursor-pointer group">
                <h3 className="text-2xl font-bold mb-1">AP Calculus</h3>
                <p className="text-white/40 text-xs mb-6">College Level Study</p>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-40">Unlocks in</p>
                  <p className="text-lg font-bold">2 Weeks</p>
                  <p className="text-[10px] text-cyber-yellow mt-2">Requires SAT Algebra Completion</p>
                </div>
              </div>

              {/* Exam 3: MCAT Biology */}
              <div className="glass-card rounded-[32px] p-8 opacity-40 hover:opacity-80 border border-white/5 transition-all cursor-pointer">
                <h3 className="text-2xl font-bold mb-1">MCAT Biology</h3>
                <p className="text-white/40 text-xs mb-6">Medical Professional Path</p>
                <div className="flex items-center gap-2 text-white/20">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  <span className="text-[10px] font-bold uppercase tracking-widest">Planned for Q3</span>
                </div>
              </div>

            </div>
          </section>

          {/* Lesson Timeline & Milestones */}
          <section className="grid grid-cols-3 gap-12 items-start">
            <div className="col-span-2">
              <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-white/40 mb-8">Module Sequence</h2>
              <div className="relative pl-12 space-y-8">

                {/* roadmap-line */}
                <div className="absolute" style={{ left: "19px", top: "32px", bottom: "32px", width: "2px", background: "rgba(255,255,255,0.1)" }} />

                {/* Completed 1 */}
                <div className="flex items-start gap-8" style={{ position: "relative", zIndex: 10 }}>
                  <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-black border-4 border-deep-onyx shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                  <div className="glass-card rounded-[24px] p-6 flex-1 border-l-4 border-green-500 opacity-60">
                    <h4 className="font-bold">Algebra Fundamentals</h4>
                    <p className="text-xs text-white/40">Week 1 • Successfully mastered with 94% accuracy</p>
                  </div>
                </div>

                {/* Completed 2 */}
                <div className="flex items-start gap-8" style={{ position: "relative", zIndex: 10 }}>
                  <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-black border-4 border-deep-onyx shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                  <div className="glass-card rounded-[24px] p-6 flex-1 border-l-4 border-green-500 opacity-60">
                    <h4 className="font-bold">Linear Equations</h4>
                    <p className="text-xs text-white/40">Week 2 • Successfully mastered with 88% accuracy</p>
                  </div>
                </div>

                {/* In Progress */}
                <div className="flex items-start gap-8" style={{ position: "relative", zIndex: 10 }}>
                  <div className="w-10 h-10 rounded-full bg-cyber-yellow flex items-center justify-center text-black border-4 border-deep-onyx shadow-[0_0_30px_rgba(253,224,71,0.5)]">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                  </div>
                  <div className="glass-card rounded-[24px] p-6 flex-1 border-l-4 border-cyber-yellow border-white/20">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-black text-cyber-yellow uppercase tracking-wide">Quadratic Equations</h4>
                      <span className="bg-cyber-yellow text-black text-[10px] px-2 py-0.5 rounded-full font-bold">CURRENT</span>
                    </div>
                    <p className="text-sm mb-4">Diving into vertex forms and factoring methods.</p>
                    <button
                      onClick={() => router.push("/chat")}
                      className="bg-cyber-yellow text-black text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-full hover:scale-105 active:scale-95 transition-all"
                    >
                      Resume Session
                    </button>
                  </div>
                </div>

                {/* Upcoming */}
                <div className="flex items-start gap-8" style={{ position: "relative", zIndex: 10 }}>
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/20 border-4 border-deep-onyx">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div className="glass-card rounded-[24px] p-6 flex-1 opacity-30">
                    <h4 className="font-bold">Polynomials</h4>
                    <p className="text-xs text-white/40">Week 4 • Locked until current module complete</p>
                  </div>
                </div>

              </div>
            </div>

            {/* Milestone Column */}
            <div className="space-y-6">
              <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-white/40 mb-8">Milestones</h2>

              {/* Milestone 1: Unlocked */}
              <div className="glass-card rounded-[32px] p-6 border-l-4 border-green-500 shadow-xl">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center text-xl">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-black">SPEED MODE</h4>
                    <p className="text-[10px] text-white/40">Unlocked at 5 Lessons</p>
                  </div>
                </div>
                <p className="text-xs opacity-60">AI will now optimize lesson length based on your focus duration.</p>
              </div>

              {/* Milestone 2: VOICE COACHING */}
              <div className="glass-card rounded-[32px] p-6 border-l-4 border-cyber-yellow shadow-xl animate-pulse">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-full bg-cyber-yellow/20 text-cyber-yellow flex items-center justify-center text-xl">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-black">VOICE COACHING</h4>
                    <p className="text-[10px] text-cyber-yellow uppercase font-bold">Unlocked at 10 Lessons</p>
                  </div>
                </div>
                <p className="text-xs opacity-60">Personalized auditory teaching available in the tutor panel.</p>
              </div>

              {/* Milestone 3: Locked */}
              <div className="glass-card rounded-[32px] p-6 opacity-30 border border-white/5 shadow-xl">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-full bg-white/5 text-white/40 flex items-center justify-center text-xl">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-black">PERSONAL STUDY PLAN</h4>
                    <p className="text-[10px] text-white/40">Unlocks at 15 Lessons</p>
                  </div>
                </div>
                <p className="text-xs opacity-60">The AI will generate a custom exam survival kit.</p>
              </div>

            </div>
          </section>

        </div>

      </main>

      <SidebarRight />

      {/* Floating Notification */}
      <div className="fixed bottom-10 left-10 space-y-3 z-50">
        <div className="bg-black/80 backdrop-blur-xl border border-cyber-yellow/30 px-4 py-3 rounded-full flex items-center gap-3 shadow-2xl">
          <div className="w-2 h-2 bg-cyber-yellow rounded-full" />
          <span className="text-[10px] font-bold uppercase tracking-widest">🧠 Roadmap Synchronized</span>
        </div>
      </div>

    </div>
  );
}
