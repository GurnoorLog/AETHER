"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/lib/auth";
import type { UserProfile } from "@/types/database";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [greetingVisible, setGreetingVisible] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
      return;
    }

    if (user) {
      const supabase = createClient();
      supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setProfile(data as UserProfile);
            setTimeout(() => setGreetingVisible(true), 300);
          }
        });
    }
  }, [user, loading, router]);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    router.replace("/");
  };

  const firstName = profile?.full_name?.split(" ")[0] || "Student";
  const preferences = profile?.preferences as Record<string, unknown> | undefined;
  const subjects = (preferences?.subjects as string[]) || [];
  const educationLevel = (preferences?.educationLevel as string) || "";

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-deep-onyx flex items-center justify-center">
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
    <div className="min-h-screen bg-deep-onyx flex flex-col">
      <header className="sticky top-0 z-50 w-full px-12 py-8 flex justify-center">
        <nav className="w-full max-w-7xl glass-card rounded-full px-10 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-cyber-yellow flex items-center justify-center">
              <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <span className="text-lg font-black tracking-tighter">AETHER</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-full">
              <div className="w-8 h-8 rounded-full bg-cyber-yellow/20 flex items-center justify-center text-xs font-black text-cyber-yellow">
                {firstName.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-bold text-white/70">{firstName}</span>
            </div>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="px-6 py-3 border border-white/10 text-white/50 text-sm font-bold rounded-full
                hover:border-red-500/40 hover:text-red-400 premium-transition cursor-pointer disabled:opacity-50"
            >
              {signingOut ? "Signing Out..." : "Sign Out"}
            </button>
          </div>
        </nav>
      </header>

      <main className="flex-1 px-8 py-16">
        <div className="max-w-4xl mx-auto">
          {/* AI Greeting */}
          <div
            className={`flex items-start gap-6 mb-16 transition-all duration-700 ${
              greetingVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <div className="w-16 h-16 rounded-2xl bg-cyber-yellow/20 flex items-center justify-center shrink-0 shadow-lg ring-1 ring-cyber-yellow/10">
              <svg className="w-8 h-8 text-cyber-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-sm font-black text-cyber-yellow">Aether</span>
                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Just now</span>
              </div>
              <p className="text-2xl md:text-3xl text-white font-black mb-4 tracking-tighter">
                Welcome back, {firstName}.
              </p>
              <p className="text-lg text-white/60 font-medium max-w-2xl leading-relaxed">
                I&apos;m ready to help you study. Upload your first document, or tell me what you&apos;d like to learn today.
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div
            className={`grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 transition-all duration-700 delay-200 ${
              greetingVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <button className="glass-card p-8 rounded-[32px] border border-white/10 hover:border-cyber-yellow/30
              premium-transition group cursor-pointer text-left">
              <div className="w-12 h-12 rounded-2xl bg-cyber-yellow/10 flex items-center justify-center mb-6 group-hover:scale-110 premium-transition">
                <svg className="w-6 h-6 text-cyber-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              </div>
              <h3 className="text-xl font-black text-white mb-2">Upload Materials</h3>
              <p className="text-sm text-white/40 font-medium">Notes, slides, or textbooks</p>
            </button>

            <button className="glass-card p-8 rounded-[32px] border border-white/10 hover:border-cyber-yellow/30
              premium-transition group cursor-pointer text-left">
              <div className="w-12 h-12 rounded-2xl bg-cyber-yellow/10 flex items-center justify-center mb-6 group-hover:scale-110 premium-transition">
                <svg className="w-6 h-6 text-cyber-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-black text-white mb-2">Start Voice Session</h3>
              <p className="text-sm text-white/40 font-medium">Talk naturally with your tutor</p>
            </button>

            <button className="glass-card p-8 rounded-[32px] border border-white/10 hover:border-cyber-yellow/30
              premium-transition group cursor-pointer text-left">
              <div className="w-12 h-12 rounded-2xl bg-cyber-yellow/10 flex items-center justify-center mb-6 group-hover:scale-110 premium-transition">
                <svg className="w-6 h-6 text-cyber-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <h3 className="text-xl font-black text-white mb-2">Practice Quiz</h3>
              <p className="text-sm text-white/40 font-medium">Test your knowledge</p>
            </button>
          </div>

          {/* Profile card */}
          <div
            className={`glass-card rounded-[32px] p-8 border border-white/10 transition-all duration-700 delay-400 ${
              greetingVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-3 h-3 rounded-full bg-success-green animate-pulse" />
              <span className="text-[11px] font-black uppercase tracking-widest text-white/30">Aether AI — Online</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Education Level</p>
                <p className="text-white/80 font-bold">{educationLevel || "Not set"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Subjects</p>
                <p className="text-white/80 font-bold">{subjects.length > 0 ? subjects.slice(0, 3).join(", ") : "Not set yet"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Knowledge Base</p>
                <p className="text-white/80 font-bold">Ready for your first upload</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-10 px-12 border-t border-white/5">
        <p className="text-white/20 text-[10px] font-bold uppercase tracking-[0.4em] text-center">
          Aether Labs Inc. &copy; 2024
        </p>
      </footer>
    </div>
  );
}
