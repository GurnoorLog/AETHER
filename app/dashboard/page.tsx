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
          if (data) setProfile(data as UserProfile);
        });
    }
  }, [user, loading, router]);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    router.replace("/");
  };

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
                {profile.full_name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-bold text-white/70">{profile.full_name}</span>
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

      <main className="flex-1 flex items-center justify-center px-8">
        <div className="text-center max-w-2xl">
          <div className="w-24 h-24 rounded-[32px] bg-cyber-yellow/10 flex items-center justify-center mx-auto mb-10">
            <svg className="w-12 h-12 text-cyber-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342" />
            </svg>
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-6 tracking-tighter">
            Welcome, {profile.full_name.split(" ")[0]}
          </h1>
          <p className="text-white/40 text-xl font-medium max-w-lg mx-auto">
            Your AI tutor is ready. Start a conversation, upload materials, or pick up where you left off.
          </p>

          <div className="mt-16 glass-card p-8 rounded-[32px] max-w-md mx-auto text-left border-white/10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-3 h-3 rounded-full bg-success-green animate-pulse" />
              <span className="text-[11px] font-black uppercase tracking-widest text-white/30">Aether AI — Online</span>
            </div>
            <p className="text-white/70 text-sm font-medium leading-relaxed">
              Your personalized dashboard, knowledge base, conversations, and learning analytics will appear here.
            </p>
          </div>
        </div>
      </main>

      <footer className="py-10 px-12 border-t border-white/5">
        <p className="text-white/20 text-[10px] font-bold uppercase tracking-[0.4em] text-center">
          Aether Labs Inc. © 2024
        </p>
      </footer>
    </div>
  );
}
