"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { useSession } from "@/app/[session]/layout";
import SidebarRight from "@/components/SidebarRight";
import SidebarLeft from "@/components/SidebarLeft";

interface BarData {
  day: string;
  height: number;
  peak: boolean;
}

interface ProgressData {
  avgMastery: number;
  conceptsLearned: number;
  accuracyStreak: number;
  BAR_DATA: BarData[];
  studyHours: number;
  totalXP: number;
  level: number;
  levelProgress: number;
  xpBreakdown: { quizzes: number; reviews: number; analysis: number };
  strengths: { name: string; mastery: number }[];
  weaknesses: { name: string; mastery: number }[];
  milestones: { title: string; completed: boolean }[];
  trendByDay: Record<string, number>;
  weekRange: string;
  peakDay: string;
  nextModuleName: string | null;
  recentHighScore: boolean;
  topQuizTitle: string | null;
}

export default function SessionProgressPage() {
  const { user, loading: authLoading } = useAuth();
  const { session } = useSession();
  const router = useRouter();

  const [animateBars, setAnimateBars] = useState(false);
  const [data, setData] = useState<ProgressData | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!authLoading && user && session) {
      fetch(`/api/progress?session_id=${session.id}`)
        .then((res) => res.json())
        .then((d) => setData(d))
        .catch(() => {});
      const timer = setTimeout(() => setAnimateBars(true), 700);
      return () => clearTimeout(timer);
    }
  }, [authLoading, user, session]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-deep-onyx flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-cyber-yellow border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const BAR_DATA = data?.BAR_DATA ?? [
    { day: "MON", height: 0, peak: false },
    { day: "TUE", height: 0, peak: false },
    { day: "WED", height: 0, peak: false },
    { day: "THU", height: 0, peak: false },
    { day: "FRI", height: 0, peak: false },
    { day: "SAT", height: 0, peak: false },
    { day: "SUN", height: 0, peak: false },
  ];

  const avgMastery = data?.avgMastery ?? 0;
  const masteryDashoffset = 552 - (552 * avgMastery) / 100;

  const conceptsLearned = data?.conceptsLearned ?? 0;
  const accuracyStreak = data?.accuracyStreak ?? 0;
  const studyHours = data?.studyHours ?? 0;
  const totalXP = data?.totalXP ?? 0;
  const level = data?.level ?? 1;
  const levelProgress = data?.levelProgress ?? 0;
  const xpBreakdown = data?.xpBreakdown ?? { quizzes: 0, reviews: 0, analysis: 0 };
  const strengths = data?.strengths ?? [];
  const weaknesses = data?.weaknesses ?? [];
  const milestones = data?.milestones ?? [];
  const weekRange = data?.weekRange ?? "";
  const peakDay = data?.peakDay ?? "MON";
  const nextModuleName = data?.nextModuleName ?? null;
  const recentHighScore = data?.recentHighScore ?? false;
  const topQuizTitle = data?.topQuizTitle ?? null;

  // Build mastery trend SVG path from trendByDay
  const trendByDay = data?.trendByDay ?? { MON: 0, TUE: 0, WED: 0, THU: 0, FRI: 0, SAT: 0, SUN: 0 };
  const trendValues = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((d) => trendByDay[d]);
  const maxTrend = Math.max(...trendValues, 1);
  const trendPoints = trendValues.map((v, i) => ({
    x: (i / 6) * 400,
    y: 140 - (v / maxTrend) * 120,
  }));

  // Build smooth curve path
  const buildCurvePath = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return "M 0 140 L 400 140";
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx = (prev.x + curr.x) / 2;
      path += ` Q ${cpx} ${prev.y} ${curr.x} ${curr.y}`;
    }
    return path;
  };

  const curvePath = buildCurvePath(trendPoints);
  const fillPath = `${curvePath} L 400 150 L 0 150 Z`;

  const formatXP = (n: number) => n.toLocaleString();

  return (
    <div className="h-screen bg-deep-onyx text-white flex overflow-hidden">
      <style>{`
        .chart-bar {
          transition: transform 1s cubic-bezier(0.22, 1, 0.36, 1);
          transform-origin: bottom;
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
      <main className="flex-1 flex flex-col relative z-0 min-w-0 h-screen overflow-hidden">

        {/* Hero Section */}
        <div className="min-h-[40vh] bg-cyber-yellow text-black p-12 liquid-wave relative flex flex-col justify-end">
          <div className="absolute top-10 right-10 flex gap-4">
            <div className="bg-black text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">WEEKLY REPORT</div>
            <div className="bg-black/10 border border-black/10 backdrop-blur-md px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">{weekRange}</div>
          </div>
          <div className="max-w-3xl mb-12">
            <p className="text-sm font-bold uppercase tracking-[0.3em] mb-4 opacity-70">Performance Analytics</p>
            <h1 className="text-7xl font-bold tracking-tighter leading-tight mb-4">Your Learning Journey</h1>
            <p className="text-xl font-medium opacity-80">{totalXP > 0 ? `You're making great progress! Your focus peaked on ${peakDay}.` : "Start your learning journey to see your progress here."}</p>
          </div>
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-black/5 rounded-full -mb-40 -mr-20" />
        </div>

        {/* Content Layer */}
        <div className="flex-1 px-12 pb-20 space-y-8 overflow-y-auto">

          {/* Main Analytics Grid */}
          <div className="grid grid-cols-12 gap-6 items-stretch">

            {/* Daily Mastery Ring */}
            <div className="col-span-4 glass-card rounded-[32px] p-8 flex flex-col items-center justify-center text-center">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-6">Daily Mastery</h4>
              <div className="relative w-48 h-48 mx-auto flex items-center justify-center mb-6">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="96" cy="96" r="88" fill="transparent" stroke="currentColor" strokeWidth="12" className="text-white/5" />
                  <circle cx="96" cy="96" r="88" fill="transparent" stroke="#FDE047" strokeWidth="12" strokeDasharray="552" strokeDashoffset={masteryDashoffset} className="transition-all duration-1000 ease-out" />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-5xl font-black">{avgMastery}%</span>
                  <span className="text-[10px] uppercase tracking-widest text-white/40 mt-1">Mastery</span>
                </div>
              </div>
              <div className="space-y-4 w-full">
                <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl">
                  <span className="text-xs text-white/60">Concepts Learned</span>
                  <span className="text-sm font-bold">{conceptsLearned}</span>
                </div>
                <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl">
                  <span className="text-xs text-white/60">Accuracy Streak</span>
                  <span className="text-sm font-bold text-cyber-yellow">{accuracyStreak}%</span>
                </div>
              </div>
            </div>

            {/* Study Hours Bar Chart */}
            <div className="col-span-8 glass-card rounded-[32px] p-8">
              <div className="flex justify-between items-end mb-8">
                <div className="space-y-1">
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Study Hours</h4>
                  <p className="text-3xl font-bold">{studyHours} hrs <span className="text-xs font-normal opacity-40">this week</span></p>
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
                      style={{ height: `${bar.height}%`, transform: animateBars ? "scaleY(1)" : "scaleY(0)" }}
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
                <span className="text-5xl font-black text-cyber-yellow">+{formatXP(totalXP)}</span>
                <span className="text-xl font-bold opacity-40 mb-1">XP</span>
              </div>
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-end text-xs font-bold">
                  <span className="text-white/60 uppercase tracking-widest">Level {level}</span>
                  <span className="text-cyber-yellow">{levelProgress}% to next level</span>
                  <span className="text-white/60 uppercase tracking-widest">Level {level + 1}</span>
                </div>
                <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-cyber-yellow rounded-full shadow-[0_0_15px_rgba(253,224,71,0.3)]" style={{ width: `${levelProgress}%` }} />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="glass-card px-4 py-2 rounded-full border border-white/5 flex items-center gap-2">
                  <span className="text-sm">QUIZZES</span>
                  <span className="text-[10px] font-bold">+{formatXP(xpBreakdown.quizzes)}</span>
                </div>
                <div className="glass-card px-4 py-2 rounded-full border border-white/5 flex items-center gap-2">
                  <span className="text-sm">REVIEWS</span>
                  <span className="text-[10px] font-bold">+{formatXP(xpBreakdown.reviews)}</span>
                </div>
                <div className="glass-card px-4 py-2 rounded-full border border-white/5 flex items-center gap-2">
                  <span className="text-sm">ANALYSIS</span>
                  <span className="text-[10px] font-bold">+{formatXP(xpBreakdown.analysis)}</span>
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
                  <path d={curvePath} fill="none" stroke="#FDE047" strokeWidth="4" className="progress-line-animate" />
                  <path d={fillPath} fill="url(#fillGrad)" />
                  {trendPoints.length > 0 && (() => {
                    const peakIdx = trendValues.indexOf(Math.max(...trendValues));
                    return <circle cx={trendPoints[peakIdx].x} cy={trendPoints[peakIdx].y} r="6" fill="#FDE047" className="pulse-soft" />;
                  })()}
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
              {milestones.length > 0 ? (
                milestones.map((m, i) => (
                  <div key={i} className="glass-card p-5 rounded-[28px] hover:scale-105 transition-all cursor-pointer group">
                    <div className="w-10 h-10 rounded-xl bg-cyber-yellow/10 flex items-center justify-center mb-4 group-hover:bg-cyber-yellow group-hover:text-black transition-colors">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-xs font-bold mb-1">{m.title}</p>
                    <p className="text-[10px] text-white/40">COMPLETED</p>
                  </div>
                ))
              ) : (
                <>
                  <div className="glass-card p-5 rounded-[28px] opacity-40">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-xs font-bold mb-1">No milestones yet</p>
                    <p className="text-[10px] text-white/40">Complete modules to earn milestones</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Strengths vs Weaknesses */}
          <div className="grid grid-cols-2 gap-6">
            <div className="glass-card rounded-[32px] p-8">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-400 mb-6">Focus Areas (Weaknesses)</h4>
              <div className="space-y-6">
                {weaknesses.length > 0 ? (
                  weaknesses.map((w, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold">{w.name}</span>
                        <span className="text-[10px] text-red-400">{w.mastery}% Mastery</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-red-400" style={{ width: `${w.mastery}%` }} />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-white/40">No focus areas yet. Keep studying!</p>
                )}
                <button className="w-full py-3 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all mt-4 cursor-pointer">Start Targeted Practice</button>
              </div>
            </div>
            <div className="glass-card rounded-[32px] p-8">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-green-400 mb-6">Your Strengths</h4>
              <div className="space-y-6">
                {strengths.length > 0 ? (
                  strengths.map((s, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold">{s.name}</span>
                        <span className="text-[10px] text-green-400">{s.mastery}% Mastery</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-green-400" style={{ width: `${s.mastery}%` }} />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-white/40">No strengths yet. Keep studying!</p>
                )}
                <button className="w-full py-3 rounded-full bg-cyber-yellow/10 text-cyber-yellow text-[10px] font-bold uppercase tracking-widest hover:bg-cyber-yellow/20 transition-all mt-4 cursor-pointer">Teach A Peer (+200 XP)</button>
              </div>
            </div>
          </div>

          {/* Smart Recommendations */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 pl-4">Smart Recommendations</h4>
            <div className="grid grid-cols-3 gap-6">
              {weaknesses.length > 0 && (
                <div className="glass-card p-6 rounded-[32px] border-t border-white/10 hover:border-cyber-yellow/50 transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                      </svg>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-1 bg-white/5 rounded-lg text-white/60">15 MIN</span>
                  </div>
                  <p className="text-sm font-bold mb-2 group-hover:text-cyber-yellow transition-colors">{weaknesses[0].name} Quiz</p>
                  <p className="text-xs text-white/40 mb-6">Targeted session to improve your {weaknesses[0].name} mastery.</p>
                  <a href="#" className="inline-block px-6 py-2 bg-cyber-yellow text-black text-[10px] font-bold rounded-full uppercase tracking-tighter">Start Quiz</a>
                </div>
              )}
              {strengths.length > 0 && (
                <div className="glass-card p-6 rounded-[32px] border-t border-white/10 hover:border-cyber-yellow/50 transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                      </svg>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-1 bg-white/5 rounded-lg text-white/60">10 MIN</span>
                  </div>
                  <p className="text-sm font-bold mb-2 group-hover:text-cyber-yellow transition-colors">{strengths[0].name} Review</p>
                  <p className="text-xs text-white/40 mb-6">Review your recent notes summarized by Aether.</p>
                  <a href="#" className="inline-block px-6 py-2 bg-white/10 text-white text-[10px] font-bold rounded-full uppercase tracking-tighter">Read Notes</a>
                </div>
              )}
              {nextModuleName && (
              <div className="glass-card p-6 rounded-[32px] border-t border-white/10 hover:border-cyan-400/50 transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 bg-cyan-400/20 rounded-lg text-cyan-400">NEXT</span>
                </div>
                <p className="text-sm font-bold mb-2 group-hover:text-cyan-400 transition-colors">{nextModuleName}</p>
                <p className="text-xs text-white/40 mb-6">Unlock the next module in your customized learning roadmap.</p>
                <a href="#" className="inline-block px-6 py-2 bg-white/10 text-white text-[10px] font-bold rounded-full uppercase tracking-tighter">Unlock Module</a>
              </div>
              )}
            </div>
          </div>

        </div>
      </main>

      <SidebarRight />

      {/* Floating Trophy Notification */}
      {recentHighScore && (
      <div className="fixed bottom-10 left-10 space-y-3 z-50">
        <div className="bg-black/80 backdrop-blur-xl border border-cyber-yellow/30 px-4 py-3 rounded-full flex items-center gap-3 shadow-2xl">
          <svg className="w-5 h-5 text-cyber-yellow animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.86L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <span className="text-[10px] font-bold uppercase tracking-widest">{topQuizTitle ? `${topQuizTitle} — High Score!` : "New High Score Unlocked"}</span>
        </div>
      </div>
      )}

    </div>
  );
}
