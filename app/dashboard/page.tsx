"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import type { Document } from "@/types/database";
import SidebarRight from "@/components/SidebarRight";
import SidebarLeft from "@/components/SidebarLeft";
import { UsageIndicator } from "@/components/UsageIndicator";
import { isPublicAdminEmail } from "@/lib/admin";

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
  return <div className={`animate-pulse bg-warm-ink/[0.04] rounded-2xl ${className ?? ""}`} />;
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

  const grab = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();

    const [pr, sr, dr, cr] = await Promise.all([
      supabase.from("user_profiles").select("full_name, onboarding_completed, preferences").eq("user_id", user.id).single(),
      supabase.from("progress_tracking").select("subject, mastery_level").eq("user_id", user.id),
      supabase.from("documents").select("*").eq("user_id", user.id).order("uploaded_at", { ascending: false }).limit(5),
      supabase.from("conversations").select("title, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);

    if (pr.data) setProfile(pr.data as { full_name: string; onboarding_completed: boolean; preferences: Record<string, unknown> });
    if (sr.data) setSubjects(sr.data as { subject: string; mastery_level: number }[]);
    if (dr.data) setDocuments(dr.data as Document[]);
    if (cr.data) setRecentConversation(cr.data as RecentConversation);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) grab();
  }, [user, grab]);

  if (authLoading || !user) {
    return (
    <div className="h-screen bg-[#FBF7F0] text-warm-ink flex overflow-hidden">
        <div className="w-[15%] shrink-0 p-6 space-y-4">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <Skeleton className="h-10 rounded-full" />
          <Skeleton className="h-48 rounded-2xl editorial" />
          <Skeleton className="h-10 rounded-2xl mt-auto editorial" />
        </div>
        <main className="flex-1 flex flex-col">
          <div className="h-[45vh] bg-sage/20 p-6 sm:p-8 lg:p-12 editorial">
            <Skeleton className="h-4 w-48 mb-4" />
            <Skeleton className="h-16 w-3/4 mb-4" />
            <Skeleton className="h-8 w-1/2" />
          </div>
          <div className="flex-1 px-4 sm:px-6 lg:px-12 space-y-4 lg:space-y-8">
            <Skeleton className="h-24 rounded-[32px] editorial" />
            <Skeleton className="h-48 rounded-[28px] max-w-4xl mx-auto editorial" />
            <Skeleton className="h-16 rounded-full max-w-4xl mx-auto" />
          </div>
        </main>
        <div className="w-[20%] shrink-0 p-6 space-y-6">
          <Skeleton className="h-64 rounded-[32px] editorial" />
          <Skeleton className="h-32 rounded-2xl editorial" />
          <Skeleton className="h-32 rounded-2xl editorial" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF7F0] text-warm-ink flex overflow-hidden">

      <SidebarLeft currentPage="home" />
      <main className="flex-1 flex flex-col relative z-0 min-w-0 h-screen overflow-hidden">


        <div className="min-h-[40vh] bg-[#FDFBF7] text-[#2D3436] p-6 sm:p-8 lg:p-12 border-b hairline relative flex flex-col justify-end editorial">
          <div className="absolute top-4 right-4 lg:top-10 lg:right-10 flex gap-2 sm:gap-4 flex-wrap">
            <div className="stamp-ink px-4 py-1 text-[10px]">STUDENT BRAIN</div>
            <div className="stamp px-4 py-1 text-[10px] text-[#3F5C3A] border-[#3F5C3A]">{subjects.length} Subjects</div>
          </div>
          <div className="max-w-3xl mb-12">
              <p className="hint-label text-sm tracking-[0.3em] uppercase mb-4 text-[#3F5C3A] flex items-center gap-3">
              <span className="rule-rough" />
              Welcome back, {profile?.full_name?.split(" ")[0] || "Student"}.
            </p>
              <h1 className="text-3xl sm:text-5xl lg:text-7xl font-bold tracking-tighter leading-tight mb-4 serif-display">
              {recentConversation
                ? `Continue "${recentConversation.title}"?`
                : documents.length > 0
                  ? "I remembered where we stopped yesterday."
                  : "Ready to start your learning journey?"}
            </h1>
            <p className="text-base sm:text-lg lg:text-xl font-medium opacity-80">
              {recentConversation
                ? `Last studied ${timeAgo(recentConversation.created_at)}`
                : subjects.length > 0
                  ? `Shall we continue with ${subjects[0].subject} or review your latest quiz?`
                  : "Upload your first document and start building your knowledge base."}
            </p>
          </div>
        </div>


        <div className="flex-1 px-4 sm:px-6 lg:px-12 pb-8 overflow-y-auto space-y-4 lg:space-y-8 relative z-10">


          <div className="flex items-center justify-between bg-white rounded-[32px] p-6 mb-8 editorial">
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
                  <span>{documents.length > 0 ? "Reviewing your notes" : "Ready to learn"}</span>
                </div>
                <UsageIndicator />
              </div>
            </div>
            <div className="flex items-center gap-4">
              {isPublicAdminEmail(user.email) && (
                <button
                  onClick={() => router.push("/admin")}
                  className="flex items-center gap-2 px-4 py-2 rounded-full btn-editorial text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                  Admin Portal
                </button>
              )}
              <button type="button" className="w-12 h-12 rounded-full border border-hairline-warm flex items-center justify-center hover:bg-warm-ink/[0.05] transition-colors cursor-pointer">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
              </button>
            </div>
          </div>


          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex justify-end">
              <div className="bg-warm-ink/[0.03] border border-hairline-warm rounded-[28px] rounded-tr-lg p-5 max-w-[80%] editorial">
                <p className="text-sm">Can you help me understand the key concepts I should focus on?</p>
              </div>
            </div>

            <div className="flex justify-start">
              <div className="flex gap-4 max-w-[90%]">
                <div className="w-10 h-10 rounded-xl bg-sage flex-shrink-0 flex items-center justify-center text-white editorial">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
                <div className="space-y-4">
                  <div className="bg-white rounded-[28px] rounded-tl-lg p-6 editorial">
                    <p className="text-sm leading-relaxed mb-4">
                      Based on your {subjects.length > 0 ? subjects.map(s => s.subject).join(", ") : "learning profile"}, I recommend starting with the fundamentals. I've analyzed your uploaded materials and identified the key areas where focused practice will help most.<span className="typing-cursor" />
                    </p>
                  </div>

                  <div className="bg-white rounded-[32px] p-6 editorial">
                    <div className="flex items-center gap-2 mb-4">
                      <svg className="w-5 h-5 text-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                      </svg>
                      <span className="text-xs font-bold uppercase tracking-widest">Study Tip</span>
                    </div>
                    <p className="text-sm text-warm-ink-soft">Try the &ldquo;Active Recall&rdquo; method. Quiz yourself on each topic after studying it. Aether can generate practice questions from any of your documents.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 opacity-60">
              <div className="w-10 h-10 rounded-full bg-sage/20 flex items-center justify-center shrink-0">
                <svg className="text-sage w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-white rounded-full typing-dot" style={{ animationDelay: '0s' }} />
                <div className="w-2 h-2 bg-white rounded-full typing-dot" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 bg-white rounded-full typing-dot" style={{ animationDelay: '0.4s' }} />
              </div>
              <span className="text-xs font-bold text-warm-ink-muted italic">Aether is thinking</span>
              <span className="text-warm-ink-soft font-black cursor-blink">|</span>
            </div>
          </div>


          <div className="sticky bottom-8 max-w-4xl mx-auto px-4 w-full">
            <div className="bg-white-warm rounded-full p-2 flex items-center gap-2 pr-4 shadow-2xl">
              <button type="button" className="w-12 h-12 rounded-full hover:bg-warm-ink/[0.05] transition-colors flex items-center justify-center text-warm-ink-muted cursor-pointer">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>

              <input
                ref={inputRef}
                type="text"
                placeholder="Ask Aether anything..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-4 text-warm-ink placeholder-warm-ink-faint outline-none"
              />

              <div className="flex items-center gap-2">
                <button type="button" className="w-12 h-12 rounded-full bg-warm-ink/[0.03] border border-hairline-warm hover:bg-warm-ink/[0.05] flex items-center justify-center text-warm-ink cursor-pointer">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                  </svg>
                </button>
                <button type="button" className="w-12 h-12 rounded-full btn-editorial btn-hard hover:scale-110 active:scale-90 transition-all flex items-center justify-center cursor-pointer">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

        </div>


        <div className="mt-auto p-6 sm:p-8 lg:p-12 border-t hairline bg-[#F4F0E9] editorial">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0 text-[#2D3436]/40">
            <span className="text-[10px] font-bold tracking-widest">TRUSTED BY STUDENTS AT</span>
            <div className="flex flex-wrap gap-4 sm:gap-6 lg:gap-12">
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