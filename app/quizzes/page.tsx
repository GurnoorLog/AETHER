"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import SidebarRight from "@/components/SidebarRight";
import SidebarLeft from "@/components/SidebarLeft";

export default function QuizzesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/");
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-[#FBF7F0] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-sage border-t-transparent rounded-full animate-spin" />
          <span className="text-warm-ink-muted text-sm font-bold uppercase tracking-widest">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#FBF7F0] text-warm-ink flex overflow-hidden">

      <SidebarLeft currentPage="quizzes" />
      <main className="flex-1 flex flex-col relative z-0 min-w-0 h-screen overflow-hidden">
        <div className="min-h-[40vh] bg-[#FDFBF7] text-[#2D3436] p-6 sm:p-8 lg:p-12 border-b hairline relative flex flex-col justify-end editorial">
          <div className="absolute top-4 right-4 lg:top-10 lg:right-10 flex gap-2 sm:gap-4">
            <div className="stamp-ink px-4 py-1 text-[10px]">DAILY GOAL: 2/3</div>
            <div className="stamp px-4 py-1 text-[10px] text-[#3F5C3A] border-[#3F5C3A]">Level 24</div>
          </div>
          <div className="max-w-3xl mb-12">
            <p className="hint-label text-sm tracking-[0.3em] uppercase mb-4 opacity-80 flex items-center gap-3"><span className="rule-rough" />Mastery Challenge</p>
            <h1 className="text-3xl sm:text-5xl lg:text-7xl font-bold tracking-tighter leading-tight mb-4 serif-display">Quiz Your Knowledge</h1>
            <p className="text-base sm:text-lg lg:text-xl font-medium opacity-80">Challenge yourself and strengthen your mastery across 14 categories.</p>
          </div>
        </div>
        <div className="flex-1 px-4 sm:px-6 lg:px-12 pb-20 space-y-6 lg:space-y-10 relative z-10 overflow-y-auto">
          <div className="flex items-center justify-between bg-white rounded-[32px] p-4 sm:p-6 mb-8 editorial">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-[#3F5C3A] flex items-center justify-center border-2 border-[#E7E1D6] editorial">
                  <svg className="w-8 h-8 text-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-cream" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Aether Core</h3>
                <div className="flex items-center gap-3 text-xs text-warm-ink-muted">
                  <span className="flex items-center gap-1 text-green-400">
                    <span className="inline-block w-1.5 h-1.5 bg-green-400 rounded-none -rotate-12" />
                    Listening
                  </span>
                  <span>•</span>
                  <span>Reviewing your notes</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button type="button" className="w-12 h-12 rounded-full border border-hairline-warm flex items-center justify-center hover:bg-warm-ink/[0.05] transition-colors cursor-pointer">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            <div className="bg-white p-4 sm:p-6 rounded-[32px] flex flex-col justify-center editorial">
              <p className="hint-label text-[10px] mb-1">Total Quizzes</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold">142</p>
            </div>
            <div className="bg-white p-6 rounded-[32px] flex flex-col justify-center editorial">
              <p className="hint-label text-[10px] mb-1">Weekly Comp</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold">12 <span className="text-sage text-xs font-medium">+2</span></p>
            </div>
            <div className="bg-white p-6 rounded-[32px] flex flex-col justify-center editorial">
              <p className="hint-label text-[10px] mb-1">Avg. Score</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold">88%</p>
            </div>
            <div className="bg-white p-6 rounded-[32px] flex flex-col justify-center editorial">
              <p className="hint-label text-[10px] mb-1">Current Streak</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold">7 Days</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
            <div className="flex flex-wrap gap-2 bg-warm-ink/[0.04] p-1.5 rounded-full border border-hairline-warm">
              <button type="button" className="px-6 py-2 rounded-full btn-editorial text-xs font-bold cursor-pointer">All Quizzes</button>
              <button type="button" className="px-6 py-2 btn-editorial-ghost text-xs font-bold cursor-pointer">Mathematics</button>
              <button type="button" className="px-6 py-2 btn-editorial-ghost text-xs font-bold cursor-pointer">Physics</button>
              <button type="button" className="px-6 py-2 btn-editorial-ghost text-xs font-bold cursor-pointer">Recently Created</button>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold opacity-40">
              <span>Sort by:</span>
              <select className="bg-transparent border-none focus:ring-0 text-warm-ink cursor-pointer">
                <option>Difficulty</option>
                <option>Mastery Gain</option>
                <option>Time</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
            <div className="bg-white p-6 lg:p-8 rounded-[40px] quiz-card transition-all duration-300 group editorial">
              <div className="flex justify-between items-start mb-6">
                <div className="space-y-2">
                  <span className="px-3 py-1 bg-green-500/10 text-green-400 text-[10px] font-black uppercase rounded-full">Easy</span>
                  <h3 className="text-xl lg:text-2xl font-bold tracking-tight">Derivatives Fundamentals</h3>
                </div>
                <div className="text-right">
                  <p className="stamp text-sm">+120 XP</p>
                  <p className="text-[10px] text-warm-ink-muted font-bold uppercase mt-1">Potential Gain</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 lg:gap-6 mb-8">
                <div className="flex items-center gap-2 opacity-60">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 6v6l4 2" />
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                  <span className="text-sm">15 mins</span>
                </div>
                <div className="flex items-center gap-2 opacity-60">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path d="M8 6h13M8 12h13M8 18h13" />
                    <circle cx="3" cy="6" r="1" fill="currentColor" />
                    <circle cx="3" cy="12" r="1" fill="currentColor" />
                    <circle cx="3" cy="18" r="1" fill="currentColor" />
                  </svg>
                  <span className="text-sm">12 Questions</span>
                </div>
                <div className="flex items-center gap-2 text-sage">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 15l-3.86 2.03.74-4.29-3.13-3.05 4.32-.63L12 5l1.93 3.91 4.32.63-3.13 3.05.74 4.29z" />
                  </svg>
                  <span className="text-sm font-bold">Best: 92%</span>
                </div>
              </div>
              <button type="button" className="w-full btn-editorial font-bold py-4 rounded-full active:scale-95 transition-all btn-hard cursor-pointer">
                Start Quiz
              </button>
            </div>
            <div className="bg-white p-6 lg:p-8 rounded-[40px] quiz-card transition-all duration-300 group editorial">
              <div className="flex justify-between items-start mb-6">
                <div className="space-y-2">
                  <span className="px-3 py-1 bg-yellow-500/10 text-yellow-400 text-[10px] font-black uppercase rounded-full">Medium</span>
                  <h3 className="text-xl lg:text-2xl font-bold tracking-tight">Integration Techniques</h3>
                </div>
                <div className="text-right">
                  <p className="stamp text-sm">+250 XP</p>
                  <p className="text-[10px] text-warm-ink-muted font-bold uppercase">Potential Gain</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 lg:gap-6 mb-8">
                <div className="flex items-center gap-2 opacity-60">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 6v6l4 2" />
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                  <span className="text-sm">30 mins</span>
                </div>
                <div className="flex items-center gap-2 opacity-60">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path d="M8 6h13M8 12h13M8 18h13" />
                    <circle cx="3" cy="6" r="1" fill="currentColor" />
                    <circle cx="3" cy="12" r="1" fill="currentColor" />
                    <circle cx="3" cy="18" r="1" fill="currentColor" />
                  </svg>
                  <span className="text-sm">25 Questions</span>
                </div>
                <div className="flex items-center gap-2 opacity-40">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 15l-3.86 2.03.74-4.29-3.13-3.05 4.32-.63L12 5l1.93 3.91 4.32.63-3.13 3.05.74 4.29z" />
                  </svg>
                  <span className="text-sm">No Attempt Yet</span>
                </div>
              </div>
              <button type="button" className="w-full btn-editorial font-bold py-4 rounded-full active:scale-95 transition-all btn-hard cursor-pointer">
                Start Quiz
              </button>
            </div>
            <div className="bg-white p-6 lg:p-8 rounded-[40px] quiz-card transition-all duration-300 group editorial">
              <div className="flex justify-between items-start mb-6">
                <div className="space-y-2">
                  <span className="px-3 py-1 bg-red-500/10 text-red-400 text-[10px] font-black uppercase rounded-full">Hard</span>
                  <h3 className="text-xl lg:text-2xl font-bold tracking-tight">Vector Calculus Master</h3>
                </div>
                <div className="text-right">
                  <p className="stamp text-sm">+500 XP</p>
                  <p className="text-[10px] text-warm-ink-muted font-bold uppercase">Potential Gain</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 lg:gap-6 mb-8">
                <div className="flex items-center gap-2 opacity-60">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 6v6l4 2" />
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                  <span className="text-sm">45 mins</span>
                </div>
                <div className="flex items-center gap-2 opacity-60">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path d="M8 6h13M8 12h13M8 18h13" />
                    <circle cx="3" cy="6" r="1" fill="currentColor" />
                    <circle cx="3" cy="12" r="1" fill="currentColor" />
                    <circle cx="3" cy="18" r="1" fill="currentColor" />
                  </svg>
                  <span className="text-sm">40 Questions</span>
                </div>
                <div className="flex items-center gap-2 text-red-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 15l-3.86 2.03.74-4.29-3.13-3.05 4.32-.63L12 5l1.93 3.91 4.32.63-3.13 3.05.74 4.29z" />
                  </svg>
                  <span className="text-sm font-bold">Prev Score: 42%</span>
                </div>
              </div>
              <button type="button" className="w-full btn-editorial font-bold py-4 rounded-full active:scale-95 transition-all btn-hard cursor-pointer">
                Retry Quiz
              </button>
            </div>
            <div className="bg-white p-6 lg:p-8 rounded-[40px] quiz-card transition-all duration-300 group editorial">
              <div className="flex justify-between items-start mb-6">
                <div className="space-y-2">
                  <span className="px-3 py-1 bg-yellow-500/10 text-yellow-400 text-[10px] font-black uppercase rounded-full">Medium</span>
                  <h3 className="text-xl lg:text-2xl font-bold tracking-tight">Linear Algebra Basis</h3>
                </div>
                <div className="text-right">
                  <p className="stamp text-sm">+180 XP</p>
                  <p className="text-[10px] text-warm-ink-muted font-bold uppercase">Potential Gain</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 lg:gap-6 mb-8">
                <div className="flex items-center gap-2 opacity-60">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 6v6l4 2" />
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                  <span className="text-sm">20 mins</span>
                </div>
                <div className="flex items-center gap-2 opacity-60">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path d="M8 6h13M8 12h13M8 18h13" />
                    <circle cx="3" cy="6" r="1" fill="currentColor" />
                    <circle cx="3" cy="12" r="1" fill="currentColor" />
                    <circle cx="3" cy="18" r="1" fill="currentColor" />
                  </svg>
                  <span className="text-sm">15 Questions</span>
                </div>
                <div className="flex items-center gap-2 opacity-40">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 15l-3.86 2.03.74-4.29-3.13-3.05 4.32-.63L12 5l1.93 3.91 4.32.63-3.13 3.05.74 4.29z" />
                  </svg>
                  <span className="text-sm">Not Started</span>
                </div>
              </div>
              <button type="button" className="w-full btn-editorial font-bold py-4 rounded-full active:scale-95 transition-all btn-hard cursor-pointer">
                Start Quiz
              </button>
            </div>

          </div>
          <div className="mt-10 lg:mt-20 py-6 sm:py-8 lg:py-12 border-t hairline bg-[#F4F0E9] rounded-t-[100px] flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0 text-[#2D3436]/40 editorial">
            <span className="text-[10px] font-bold tracking-widest px-4 sm:px-6 lg:px-12">CHALLENGE SPONSORS</span>
            <div className="flex flex-wrap gap-4 sm:gap-8 lg:gap-16 px-4 sm:px-6 lg:px-12">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 12l2 2 4-4" />
                </svg>
                <span className="font-bold tracking-tighter">OpenAI</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
                <span className="font-bold tracking-tighter">Notion</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2l5.5 9.5L12 21l-5.5-9.5L12 2z" />
                  <path d="M12 2v19" />
                </svg>
                <span className="font-bold tracking-tighter">Figma</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.167 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
                <span className="font-bold tracking-tighter">Github</span>
              </div>
            </div>
          </div>

        </div>
      </main>

      <SidebarRight />
      <div className="fixed bottom-4 left-4 lg:bottom-10 lg:left-10 space-y-3 z-50">
        <div className="bg-[#FDFBF7] backdrop-blur-xl border border-[#E7E1D6] px-6 py-4 rounded-full flex items-center gap-4 animate-scale-in shadow-[0_20px_50px_rgba(45,52,54,0.12)]">
          <div className="w-3 h-3 bg-sage rounded-full" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">New quiz generated</span>
        </div>
      </div>

    </div>
  );
}