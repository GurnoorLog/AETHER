"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import SidebarRight from "@/components/SidebarRight";
import SidebarLeft from "@/components/SidebarLeft";

const BAR_DATA = [
  { day: "MON", height: 40, peak: false },
  { day: "TUE", height: 65, peak: false },
  { day: "WED", height: 95, peak: true },
  { day: "THU", height: 50, peak: false },
  { day: "FRI", height: 75, peak: false },
  { day: "SAT", height: 45, peak: false },
  { day: "SUN", height: 30, peak: false },
];

export default function ProgressPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [animateBars, setAnimateBars] = useState(false);
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

  useEffect(() => {
    if (!authLoading && user) {
      const timer = setTimeout(() => setAnimateBars(true), 700);
      return () => clearTimeout(timer);
    }
  }, [authLoading, user]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-deep-onyx flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-cyber-yellow border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-deep-onyx text-white flex overflow-hidden">
      <style>{`
        .chart-bar {
          transition: height 1s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .progress-line-animate {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: dash 3s ease-in-out forwards;
        }
        @keyframes dash {
          to { stroke-dashoffset: 0; }
        }
        .pulse-soft {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>

      <SidebarLeft currentPage="progress" />

      {/* Center Workspace */}
      <main className="flex-1 flex flex-col relative z-0 overflow-y-auto h-screen">

        {/* Hero Section */}
        <div className="h-[35vh] bg-cyber-yellow text-black p-12 liquid-wave relative overflow-hidden flex flex-col justify-end flex-shrink-0">
          <div className="absolute top-10 right-10 flex gap-4">
            <div className="bg-black text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">WEEKLY REPORT</div>
            <div className="bg-black/10 border border-black/10 backdrop-blur-md px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">MARCH 10 - 17</div>
          </div>
          <div className="max-w-3xl mb-8">
            <p className="text-sm font-bold uppercase tracking-[0.3em] mb-4 opacity-70">Performance Analytics</p>
            <h1 className="text-6xl font-bold tracking-tighter leading-tight mb-2">Your Learning Journey</h1>
            <p className="text-lg font-medium opacity-80">You&apos;re in the top 5% of learners this week. Your focus peaked on Wednesday.</p>
          </div>
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-black/5 rounded-full -mb-40 -mr-20" />
        </div>

        {/* Content Layer */}
        <div className="px-12 -mt-16 pb-20 space-y-8">

          {/* Main Analytics Grid */}
          <div className="grid grid-cols-12 gap-6 items-stretch">

            {/* Daily Mastery Ring */}
            <div className="col-span-4 glass-card rounded-[32px] p-8 flex flex-col items-center justify-center text-center">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-6">Daily Mastery</h4>
              <div className="relative w-48 h-48 mx-auto flex items-center justify-center mb-6">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="96" cy="96" r="88" fill="transparent" stroke="currentColor" strokeWidth="12" className="text-white/5" />
                  <circle cx="96" cy="96" r="88" fill="transparent" stroke="#FDE047" strokeWidth="12" strokeDasharray="552" strokeDashoffset="55" className="transition-all duration-1000 ease-out" />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-5xl font-black">90%</span>
                  <span className="text-[10px] uppercase tracking-widest text-white/40 mt-1">Mastery</span>
                </div>
              </div>
              <div className="space-y-4 w-full">
                <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl">
                  <span className="text-xs text-white/60">Concepts Learned</span>
                  <span className="text-sm font-bold">12</span>
                </div>
                <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl">
                  <span className="text-xs text-white/60">Accuracy Streak</span>
                  <span className="text-sm font-bold text-cyber-yellow">94%</span>
                </div>
              </div>
            </div>

            {/* Study Hours Bar Chart */}
            <div className="col-span-8 glass-card rounded-[32px] p-8">
              <div className="flex justify-between items-end mb-8">
                <div className="space-y-1">
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Study Hours</h4>
                  <p className="text-3xl font-bold">28.5 hrs <span className="text-xs font-normal opacity-40">this week</span></p>
                </div>
                <div className="flex gap-2">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-cyber-yellow">
                    <div className="w-2 h-2 rounded-full bg-cyber-yellow" />
                    Current
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-white/20">
                    <div className="w-2 h-2 rounded-full bg-white/20" />
                    Avg
                  </div>
                </div>
              </div>
              <div className="h-48 flex items-end justify-between px-4 mb-4 gap-4">
                {BAR_DATA.map((bar) => (
                  <div key={bar.day} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className={`w-full rounded-t-lg chart-bar ${bar.peak ? "bg-gradient-to-t from-cyber-yellow to-cyan-400 shadow-[0_0_20px_rgba(253,224,71,0.2)]" : "bg-white/5"}`}
                      style={{ height: animateBars ? `${bar.height}%` : "0%" }}
                    />
                    <span className={`text-[10px] font-bold ${bar.peak ? "text-cyber-yellow" : "opacity-30"}`}>{bar.day}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* XP and Mastery Trend */}
          <div className="grid grid-cols-2 gap-6">

            {/* XP Card */}
            <div className="glass-card rounded-[32px] p-8">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-6">Experience Points</h4>
              <div className="flex items-end gap-3 mb-6">
                <span className="text-5xl font-black text-cyber-yellow">+2,450</span>
                <span className="text-xl font-bold opacity-40 mb-1">XP</span>
              </div>
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-end text-xs font-bold">
                  <span className="text-white/60 uppercase tracking-widest">Level 23</span>
                  <span className="text-cyber-yellow">65% to next level</span>
                  <span className="text-white/60 uppercase tracking-widest">Level 24</span>
                </div>
                <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-cyber-yellow rounded-full w-[65%] shadow-[0_0_15px_rgba(253,224,71,0.3)]" />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="glass-card px-4 py-2 rounded-full border border-white/5 flex items-center gap-2">
                  <span className="text-sm">📝</span>
                  <span className="text-[10px] font-bold">QUIZZES +850</span>
                </div>
                <div className="glass-card px-4 py-2 rounded-full border border-white/5 flex items-center gap-2">
                  <span className="text-sm">🔄</span>
                  <span className="text-[10px] font-bold">REVIEWS +600</span>
                </div>
                <div className="glass-card px-4 py-2 rounded-full border border-white/5 flex items-center gap-2">
                  <span className="text-sm">📄</span>
                  <span className="text-[10px] font-bold">ANALYSIS +250</span>
                </div>
              </div>
            </div>

            {/* Mastery Trend Graph */}
            <div className="glass-card rounded-[32px] p-8 flex flex-col">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-6">Mastery Trend</h4>
              <div className="flex-1 relative mt-4">
                <svg viewBox="0 0 400 150" className="w-full h-full">
                  <defs>
                    <linearGradient id="fillGrad" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#FDE047" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#FDE047" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M 0 100 Q 50 120 100 80 T 200 60 T 300 30 T 400 45" fill="none" stroke="#FDE047" strokeWidth="4" className="progress-line-animate" />
                  <path d="M 0 100 Q 50 120 100 80 T 200 60 T 300 30 T 400 45 L 400 150 L 0 150 Z" fill="url(#fillGrad)" />
                  <circle cx="300" cy="30" r="6" fill="#FDE047" className="pulse-soft" />
                </svg>
                <div className="flex justify-between mt-4 px-2">
                  <span className="text-[9px] font-bold opacity-20">MON</span>
                  <span className="text-[9px] font-bold opacity-20">WED</span>
                  <span className="text-[9px] font-bold opacity-20">FRI</span>
                  <span className="text-[9px] font-bold opacity-20">SUN</span>
                </div>
              </div>
            </div>
          </div>

          {/* Learning Milestones */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 pl-4">Learning Milestones</h4>
            <div className="grid grid-cols-4 gap-4">
              <div className="glass-card p-5 rounded-[28px] hover:scale-105 transition-all cursor-pointer group">
                <div className="w-10 h-10 rounded-xl bg-cyber-yellow/10 flex items-center justify-center mb-4 group-hover:bg-cyber-yellow group-hover:text-black transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-xs font-bold mb-1">Biology Ch. 5</p>
                <p className="text-[10px] text-white/40">COMPLETED &bull; MAR 14</p>
              </div>
              <div className="glass-card p-5 rounded-[28px] hover:scale-105 transition-all cursor-pointer group">
                <div className="w-10 h-10 rounded-xl bg-cyan-400/10 flex items-center justify-center mb-4 text-cyan-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                  </svg>
                </div>
                <p className="text-xs font-bold mb-1">Derivatives Mastery</p>
                <p className="text-[10px] text-white/40">MASTERED &bull; MAR 15</p>
              </div>
              <div className="glass-card p-5 rounded-[28px] hover:scale-105 transition-all cursor-pointer group border-l-4 border-cyber-yellow">
                <div className="w-10 h-10 rounded-xl bg-cyber-yellow text-black flex items-center justify-center mb-4">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                    <path d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
                  </svg>
                </div>
                <p className="text-xs font-bold mb-1">7-Day Streak</p>
                <p className="text-[10px] text-white/40 uppercase">Achievement</p>
              </div>
              <div className="glass-card p-5 rounded-[28px] opacity-40 hover:opacity-100 transition-all cursor-pointer group">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path d="M16.5 18.75h-9m0 0a9 9 0 01-9-9m18 0a9 9 0 01-9 9m0 0a9 9 0 019-9m0 0a9 9 0 00-9-9m9 9h-9" />
                  </svg>
                </div>
                <p className="text-xs font-bold mb-1">Perfect Score</p>
                <p className="text-[10px] text-white/40 uppercase tracking-widest">UPCOMING</p>
              </div>
            </div>
          </div>

          {/* Strengths vs Weaknesses */}
          <div className="grid grid-cols-2 gap-6">
            <div className="glass-card rounded-[32px] p-8 border-l-4 border-red-500/50">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-400 mb-6">Focus Areas (Weaknesses)</h4>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold">Complex Integrals</span>
                    <span className="text-[10px] text-red-400">Needs Review</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-red-400 w-[35%]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold">Statistical Analysis</span>
                    <span className="text-[10px] text-orange-400">Improving</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-400 w-[55%]" />
                  </div>
                </div>
                <button className="w-full py-3 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all mt-4 cursor-pointer">Start Targeted Practice</button>
              </div>
            </div>
            <div className="glass-card rounded-[32px] p-8 border-l-4 border-green-500/50">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-green-400 mb-6">Your Strengths</h4>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold">Calculus Fundamentals</span>
                    <span className="text-[10px] text-green-400">98% Mastery</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-green-400 w-[98%]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold">Linear Algebra</span>
                    <span className="text-[10px] text-green-400">92% Mastery</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-green-400 w-[92%]" />
                  </div>
                </div>
                <button className="w-full py-3 rounded-full bg-cyber-yellow/10 text-cyber-yellow text-[10px] font-bold uppercase tracking-widest hover:bg-cyber-yellow/20 transition-all mt-4 cursor-pointer">Teach A Peer (+200 XP)</button>
              </div>
            </div>
          </div>

          {/* Smart Recommendations */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 pl-4">Smart Recommendations</h4>
            <div className="grid grid-cols-3 gap-6">
              <div className="glass-card p-6 rounded-[32px] border-t border-white/10 hover:border-cyber-yellow/50 transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 bg-white/5 rounded-lg text-white/60">15 MIN</span>
                </div>
                <p className="text-sm font-bold mb-2 group-hover:text-cyber-yellow transition-colors">Integrals Mastery Quiz</p>
                <p className="text-xs text-white/40 mb-6">Targeted session to improve your lowest score from Tuesday.</p>
                <a href="#" className="inline-block px-6 py-2 bg-cyber-yellow text-black text-[10px] font-bold rounded-full uppercase tracking-tighter">Start Quiz</a>
              </div>
              <div className="glass-card p-6 rounded-[32px] border-t border-white/10 hover:border-cyber-yellow/50 transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 bg-white/5 rounded-lg text-white/60">10 MIN</span>
                </div>
                <p className="text-sm font-bold mb-2 group-hover:text-cyber-yellow transition-colors">Probability Review</p>
                <p className="text-xs text-white/40 mb-6">Review your recent lecture notes summarized by Aether.</p>
                <a href="#" className="inline-block px-6 py-2 bg-white/10 text-white text-[10px] font-bold rounded-full uppercase tracking-tighter">Read Notes</a>
              </div>
              <div className="glass-card p-6 rounded-[32px] border-t border-white/10 hover:border-cyan-400/50 transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 bg-cyan-400/20 rounded-lg text-cyan-400">NEW</span>
                </div>
                <p className="text-sm font-bold mb-2 group-hover:text-cyan-400 transition-colors">Advanced Calculus</p>
                <p className="text-xs text-white/40 mb-6">Unlock the next module in your customized learning roadmap.</p>
                <a href="#" className="inline-block px-6 py-2 bg-white/10 text-white text-[10px] font-bold rounded-full uppercase tracking-tighter">Unlock Module</a>
              </div>
            </div>
          </div>

        </div>
      </main>

      <SidebarRight />

      {/* Floating Trophy Notification */}
      <div className="fixed bottom-10 left-10 space-y-3 z-50">
        <div className="bg-black/80 backdrop-blur-xl border border-cyber-yellow/30 px-4 py-3 rounded-full flex items-center gap-3 shadow-2xl">
          <svg className="w-5 h-5 text-cyber-yellow animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.86L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <span className="text-[10px] font-bold uppercase tracking-widest">🏆 New High Score Unlocked</span>
        </div>
      </div>

    </div>
  );
}
