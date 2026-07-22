"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import type { Document } from "@/types/database";
import SidebarRight from "@/components/SidebarRight";
import SidebarLeft from "@/components/SidebarLeft";

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-white/5 rounded-2xl ${className ?? ""}`} />;
}

export default function ChatPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<{ full_name: string } | null>(null);
  const [subjects, setSubjects] = useState<{ subject: string; mastery_level: number }[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [showIllustration, setShowIllustration] = useState(true);
  const [isMusicPlaying, setIsMusicPlaying] = useState(true);

  const fetchChatData = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();

    const [profileRes, subjectsRes, docsRes] = await Promise.all([
      supabase.from("user_profiles").select("full_name").eq("user_id", user.id).single(),
      supabase.from("progress_tracking").select("subject, mastery_level").eq("user_id", user.id),
      supabase.from("documents").select("*").eq("user_id", user.id).order("uploaded_at", { ascending: false }).limit(5),
    ]);

    if (profileRes.data) setProfile(profileRes.data as { full_name: string });
    if (subjectsRes.data) setSubjects(subjectsRes.data as { subject: string; mastery_level: number }[]);
    if (docsRes.data) setDocuments(docsRes.data as Document[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) fetchChatData();
  }, [user, fetchChatData]);

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
          <div className="p-6 pb-0">
            <Skeleton className="h-32 rounded-[32px]" />
          </div>
          <div className="flex-1 px-8 space-y-8 py-6">
            <Skeleton className="h-20 rounded-[28px] max-w-[80%] ml-auto" />
            <Skeleton className="h-64 rounded-[28px] max-w-[85%]" />
            <Skeleton className="h-20 rounded-[28px] max-w-[80%] ml-auto" />
            <Skeleton className="h-48 rounded-[28px] max-w-[90%]" />
          </div>
          <div className="p-8">
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

  const userName = profile?.full_name?.split(" ")[0] || "Student";

  return (
    <div className="min-h-screen bg-deep-onyx text-white flex overflow-hidden">

      <SidebarLeft currentPage="tutor" />

      {/* Center Workspace */}
      <main className="flex-1 flex flex-col relative z-0 min-w-0 h-full">

        {/* Aether Core Status Header */}
        <header className="p-6 pb-0">
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
                  <span>Reviewing your notes</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-end gap-1.5 h-10">
                <div className="waveform-bar bg-cyber-yellow w-1 rounded-full" style={{ animationDelay: "-0.2s" }} />
                <div className="waveform-bar bg-cyan-400 w-1 rounded-full" style={{ animationDelay: "-0.4s" }} />
                <div className="waveform-bar bg-cyber-yellow w-1 rounded-full" style={{ animationDelay: "-0.1s" }} />
                <div className="waveform-bar bg-white/60 w-1 rounded-full" style={{ animationDelay: "-0.5s" }} />
                <div className="waveform-bar bg-cyber-yellow w-1 rounded-full" style={{ animationDelay: "-0.3s" }} />
              </div>
              <button type="button" className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors cursor-pointer">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto px-8 pb-32 space-y-8">
          <div className="max-w-4xl mx-auto space-y-10 py-6">

            <div className="flex justify-end">
              <div className="bg-white/5 border border-white/10 rounded-[28px] rounded-tr-lg p-5 max-w-[80%] shadow-lg">
                <p className="text-sm leading-relaxed">I&apos;m having trouble understanding why the derivatives of trigonometric functions like sine and cosine switch signs the way they do. Is there a visual way to think about it?</p>
              </div>
            </div>

            <div className="flex justify-start items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-cyber-yellow flex-shrink-0 flex items-center justify-center text-black shadow-[0_0_15px_rgba(253,224,71,0.4)]">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <div className="space-y-6 max-w-[85%]">
                <div className="glass-card rounded-[28px] rounded-tl-lg p-6">
                  <p className="text-sm leading-relaxed mb-4">That&apos;s a fantastic question, {userName}. Most students just memorize it, but there&apos;s a beautiful geometric intuition behind it. 🎨</p>
                  <p className="text-sm leading-relaxed">Think of a point moving around a <b>unit circle</b>. The height of the point is sin(θ) and its horizontal position is cos(θ). The derivative is simply the velocity vector of that point.</p>
                </div>
                <div className="glass-card rounded-[32px] p-6 border-l-4 border-cyber-yellow shadow-2xl">
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-5 h-5 text-cyber-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                    </svg>
                    <span className="text-xs font-bold uppercase tracking-widest">Visual Explanation</span>
                  </div>
                  {showIllustration && (
                    <div className="bg-black/40 rounded-2xl h-48 mb-4 border border-white/5 flex items-center justify-center overflow-hidden relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-cyber-yellow/10 to-transparent" />
                      <div className="z-10 text-center">
                        <div className="flex items-center justify-center gap-1 mb-2">
                          <div className="w-1 h-20 bg-cyber-yellow" />
                          <div className="w-1 h-16 bg-cyber-yellow/80" />
                          <div className="w-1 h-24 bg-cyber-yellow/60" />
                          <div className="w-1 h-12 bg-cyber-yellow/40" />
                          <div className="w-1 h-32 bg-cyber-yellow" />
                        </div>
                        <p className="text-[10px] text-white/40 uppercase tracking-tight">Visualizing Slope Accumulation</p>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" className="bg-cyber-yellow text-black text-xs font-bold py-3 rounded-full hover:scale-105 active:scale-95 transition-all cursor-pointer">Interactive Demo</button>
                    <button type="button" className="bg-white/5 text-white text-xs font-bold py-3 rounded-full border border-white/10 hover:bg-white/10 transition-all cursor-pointer">Step-by-Step</button>
                  </div>
                </div>
                <div className="glass-card rounded-[28px] p-6">
                  <p className="text-sm leading-relaxed">Notice how as sin(θ) increases (moving up), the velocity vector points to the left? That&apos;s why <code className="text-cyber-yellow">d/dθ [sin(θ)] = cos(θ)</code>, but <code className="text-cyber-yellow">d/dθ [cos(θ)] = -sin(θ)</code>. The negative sign represents the direction change.</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <div className="bg-white/5 border border-white/10 rounded-[28px] rounded-tr-lg p-5 max-w-[80%] shadow-lg">
                <p className="text-sm leading-relaxed">Oh! So it&apos;s basically a 90-degree rotation of the position vector? Can you show me how that works in code? Like a simple animation logic?</p>
              </div>
            </div>

            <div className="flex justify-start items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-cyber-yellow flex-shrink-0 flex items-center justify-center text-black shadow-[0_0_15px_rgba(253,224,71,0.4)]">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <div className="space-y-6 max-w-[90%]">
                <div className="glass-card rounded-[28px] rounded-tl-lg p-6">
                  <p className="text-sm leading-relaxed mb-4">Exactly! You&apos;re thinking like a developer now. In a 2D coordinate system, a 90-degree counter-clockwise rotation swaps coordinates and negates one. Here is how that looks in logic:</p>
                  <div className="bg-black/50 rounded-2xl p-4 border border-white/10 font-mono text-xs overflow-x-auto my-4">
                    <pre className="text-cyber-yellow">// Position Vector (cos, sin)
let x = Math.cos(theta);
let y = Math.sin(theta);

// Velocity Vector (Derivative)
// Rotated by 90 degrees
let vx = -y; // -sin(theta)
let vy = x;  // cos(theta)</pre>
                  </div>
                  <p className="text-sm leading-relaxed">This is why the sign flips! Does that help clear up the &lsquo;why&rsquo; behind the formulas?</p>
                  <span className="inline-block w-2 h-4 bg-cyber-yellow ml-0.5 typing-cursor" />
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
                <div className="w-2 h-2 bg-white rounded-full typing-dot" style={{ animationDelay: "0s" }} />
                <div className="w-2 h-2 bg-white rounded-full typing-dot" style={{ animationDelay: "0.2s" }} />
                <div className="w-2 h-2 bg-white rounded-full typing-dot" style={{ animationDelay: "0.4s" }} />
              </div>
              <span className="text-xs font-bold text-white/40 italic">Aether is thinking</span>
              <span className="text-white/60 font-black cursor-blink">|</span>
            </div>

          </div>
        </div>

        {/* Composer (fixed at bottom) */}
        <div className="absolute bottom-0 left-0 right-0 p-8 pt-0 bg-gradient-to-t from-deep-onyx via-deep-onyx/90 to-transparent">
          <div className="sticky bottom-8 max-w-4xl mx-auto px-4 w-full">
            <div className="glass-card-premium rounded-full p-2 flex items-center gap-2 pr-4 shadow-2xl">
              <button type="button" className="w-12 h-12 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center text-white/40 cursor-pointer">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>
              <input type="text" placeholder="Ask Aether anything..." value={inputValue} onChange={(e) => setInputValue(e.target.value)} className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-4 text-white placeholder-white/40 outline-none" />
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

      </main>

      <SidebarRight />

      {/* Floating "Aether is speaking" waveform bar */}
      <div className="fixed bottom-24 left-[18%] flex items-center gap-2 z-50">
        <div className="bg-black/80 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-full flex items-center gap-3 shadow-2xl">
          <div className="flex items-end gap-1 h-6">
            <div className="waveform-bar bg-cyber-yellow w-1 rounded-full" style={{ animationDuration: "0.8s", height: "60%" }} />
            <div className="waveform-bar bg-cyber-yellow w-1 rounded-full" style={{ animationDuration: "1.2s", height: "80%" }} />
            <div className="waveform-bar bg-cyber-yellow w-1 rounded-full" style={{ animationDuration: "0.5s", height: "40%" }} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-cyber-yellow">Aether is speaking...</span>
        </div>
      </div>

    </div>
  );
}
