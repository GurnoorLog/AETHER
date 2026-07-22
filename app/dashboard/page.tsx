"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import type { Document } from "@/types/database";
import SidebarRight from "@/components/SidebarRight";
import SidebarLeft from "@/components/SidebarLeft";

interface RecentConversation {
  title: string;
  created_at: string;
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-white/5 rounded-2xl ${className ?? ""}`} />;
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<{ full_name: string; onboarding_completed: boolean; preferences: Record<string, unknown> } | null>(null);
  const [subjects, setSubjects] = useState<{ subject: string; mastery_level: number }[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [recentConversation, setRecentConversation] = useState<RecentConversation | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();

    const [profileRes, subjectsRes, docsRes, convRes] = await Promise.all([
      supabase.from("user_profiles").select("full_name, onboarding_completed, preferences").eq("user_id", user.id).single(),
      supabase.from("progress_tracking").select("subject, mastery_level").eq("user_id", user.id),
      supabase.from("documents").select("*").eq("user_id", user.id).order("uploaded_at", { ascending: false }).limit(5),
      supabase.from("conversations").select("title, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);

    if (profileRes.data) setProfile(profileRes.data as { full_name: string; onboarding_completed: boolean; preferences: Record<string, unknown> });
    if (subjectsRes.data) setSubjects(subjectsRes.data as { subject: string; mastery_level: number }[]);
    if (docsRes.data) setDocuments(docsRes.data as Document[]);
    if (convRes.data) setRecentConversation(convRes.data as RecentConversation);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) fetchDashboardData();
  }, [user, fetchDashboardData]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-deep-onyx text-white flex overflow-hidden">
        <div className="w-[15%] shrink-0 p-6 space-y-4">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <Skeleton className="h-10 rounded-full" />
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-10 rounded-2xl mt-auto" />
        </div>
        <main className="flex-1 flex flex-col">
          <div className="h-[45vh] bg-cyber-yellow/20 p-12">
            <Skeleton className="h-4 w-48 mb-4" />
            <Skeleton className="h-16 w-3/4 mb-4" />
            <Skeleton className="h-8 w-1/2" />
          </div>
          <div className="flex-1 -mt-16 px-12 space-y-8">
            <Skeleton className="h-24 rounded-[32px]" />
            <Skeleton className="h-48 rounded-[28px] max-w-4xl mx-auto" />
            <Skeleton className="h-16 rounded-full max-w-4xl mx-auto" />
          </div>
        </main>
        <div className="w-[20%] shrink-0 p-6 space-y-6">
          <Skeleton className="h-64 rounded-[32px]" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-deep-onyx text-white flex overflow-hidden">

      <SidebarLeft currentPage="home" />

      {/* Center Workspace */}
      <main className="flex-1 flex flex-col relative z-0 min-w-0">

        {/* Hero Section */}
        <div className="h-[45vh] bg-cyber-yellow text-black p-12 liquid-wave relative overflow-hidden flex flex-col justify-end">
          <div className="absolute top-10 right-10 flex gap-4">
            <div className="bg-black text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">STUDENT BRAIN</div>
            <div className="bg-black/10 border border-black/10 backdrop-blur-md px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">{subjects.length} Subjects</div>
          </div>
          <div className="max-w-3xl mb-12">
            <p className="text-sm font-bold uppercase tracking-[0.3em] mb-4 opacity-70">
              Welcome back, {profile?.full_name?.split(" ")[0] || "Student"}.
            </p>
            <h1 className="text-6xl md:text-7xl font-bold tracking-tighter leading-tight mb-4">
              {recentConversation
                ? `Continue "${recentConversation.title}"?`
                : documents.length > 0
                  ? "I remembered where we stopped yesterday."
                  : "Ready to start your learning journey?"}
            </h1>
            <p className="text-xl font-medium opacity-80">
              {recentConversation
                ? `Last studied ${timeAgo(recentConversation.created_at)}`
                : subjects.length > 0
                  ? `Shall we continue with ${subjects[0].subject} or review your latest quiz?`
                  : "Upload your first document and start building your knowledge base."}
            </p>
          </div>
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-black/5 rounded-full -mb-40 -mr-20" />
        </div>

        {/* Content */}
        <div className="flex-1 -mt-16 px-12 pb-8 overflow-y-auto space-y-8">

          {/* Aether Core Status */}
          <div className="flex items-center justify-between glass-card rounded-[32px] p-6 mb-8">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-black flex items-center justify-center border-2 border-cyber-yellow">
                  <svg className="w-8 h-8 text-cyber-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-deep-onyx" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Aether Core</h3>
                <div className="flex items-center gap-3 text-xs text-white/50">
                  <span className="flex items-center gap-1 text-green-400">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    Listening
                  </span>
                  <span>•</span>
                  <span>{documents.length > 0 ? "Reviewing your notes" : "Ready to learn"}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-end gap-1.5 h-10">
                <div className="waveform-bar bg-cyber-yellow w-1 rounded-full" style={{ animationDuration: '0.5s' }} />
                <div className="waveform-bar bg-cyan-400 w-1 rounded-full" style={{ animationDuration: '1.0s' }} />
                <div className="waveform-bar bg-cyber-yellow w-1 rounded-full" style={{ animationDuration: '0.7s' }} />
                <div className="waveform-bar bg-white/60 w-1 rounded-full" style={{ animationDuration: '1.3s' }} />
                <div className="waveform-bar bg-cyber-yellow w-1 rounded-full" style={{ animationDuration: '0.9s' }} />
              </div>
              <button type="button" className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors cursor-pointer">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex justify-end">
              <div className="bg-white/5 border border-white/10 rounded-[28px] rounded-tr-lg p-5 max-w-[80%]">
                <p className="text-sm">Can you help me understand the key concepts I should focus on?</p>
              </div>
            </div>

            <div className="flex justify-start">
              <div className="flex gap-4 max-w-[90%]">
                <div className="w-10 h-10 rounded-xl bg-cyber-yellow flex-shrink-0 flex items-center justify-center text-black">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
                <div className="space-y-4">
                  <div className="glass-card rounded-[28px] rounded-tl-lg p-6">
                    <p className="text-sm leading-relaxed mb-4">
                      Based on your {subjects.length > 0 ? subjects.map(s => s.subject).join(", ") : "learning profile"}, I recommend starting with the fundamentals. I've analyzed your uploaded materials and identified the key areas where focused practice will help most.<span className="typing-cursor" />
                    </p>
                  </div>

                  <div className="glass-card rounded-[32px] p-6 border-l-4 border-cyber-yellow shadow-2xl">
                    <div className="flex items-center gap-2 mb-4">
                      <svg className="w-5 h-5 text-cyber-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                      </svg>
                      <span className="text-xs font-bold uppercase tracking-widest">Study Tip</span>
                    </div>
                    <p className="text-sm text-white/70">Try the &ldquo;Active Recall&rdquo; method — quiz yourself on each topic after studying it. Aether can generate practice questions from any of your documents.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 opacity-60">
              <div className="w-10 h-10 rounded-full bg-cyber-yellow/20 flex items-center justify-center shrink-0">
                <svg className="text-cyber-yellow w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-white rounded-full typing-dot" style={{ animationDelay: '0s' }} />
                <div className="w-2 h-2 bg-white rounded-full typing-dot" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 bg-white rounded-full typing-dot" style={{ animationDelay: '0.4s' }} />
              </div>
              <span className="text-xs font-bold text-white/40 italic">Aether is thinking</span>
              <span className="text-white/60 font-black cursor-blink">|</span>
            </div>
          </div>

          {/* Input Composer */}
          <div className="sticky bottom-8 max-w-4xl mx-auto px-4 w-full">
            <div className="glass-card-premium rounded-full p-2 flex items-center gap-2 pr-4 shadow-2xl">
              <button type="button" className="w-12 h-12 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center text-white/40 cursor-pointer">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>

              <input
                ref={inputRef}
                type="text"
                placeholder="Ask Aether anything..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-4 text-white placeholder-white/40 outline-none"
              />

              <div className="flex items-center gap-2">
                <button type="button" className="w-12 h-12 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center text-white cursor-pointer">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                  </svg>
                </button>
                <button type="button" className="w-12 h-12 rounded-full bg-cyber-yellow text-black shadow-[0_0_20px_rgba(253,224,71,0.3)] hover:scale-110 active:scale-90 transition-all flex items-center justify-center cursor-pointer">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Ticker */}
        <div className="mt-auto p-12 border-t border-white/5 bg-black">
          <div className="flex items-center justify-between opacity-30 grayscale">
            <span className="text-[10px] font-bold tracking-widest">TRUSTED BY STUDENTS AT</span>
            <div className="flex gap-12">
              <span className="font-bold tracking-tighter">OpenAI</span>
              <span className="font-bold tracking-tighter">Notion</span>
              <span className="font-bold tracking-tighter">Figma</span>
              <span className="font-bold tracking-tighter">Github</span>
            </div>
          </div>
        </div>

      </main>

      <SidebarRight />
    </div>
  );
}
