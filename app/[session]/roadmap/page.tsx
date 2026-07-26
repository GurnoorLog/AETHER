"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "../layout";
import SidebarRight from "@/components/SidebarRight";
import SidebarLeft from "@/components/SidebarLeft";

interface RoadmapModule {
  id: string;
  module_index: number;
  title: string;
  description: string;
  status: "completed" | "current" | "locked";
  completed_at: string | null;
}

export default function SessionRoadmapPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { session } = useSession();
  const [modules, setModules] = useState<RoadmapModule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/");
  }, [user, authLoading, router]);

  const fetchModules = useCallback(async () => {
    if (!user || !session) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("session_roadmap_modules")
      .select("*")
      .eq("session_id", session.id)
      .eq("user_id", user.id)
      .order("module_index", { ascending: true });
    if (data) setModules(data as RoadmapModule[]);
    setLoading(false);
  }, [user, session]);

  useEffect(() => {
    if (user) fetchModules();
  }, [user, fetchModules]);

  const markComplete = useCallback(async (moduleId: string) => {
    if (!user) return;
    const supabase = createClient();
    await supabase
      .from("session_roadmap_modules")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", moduleId)
      .eq("user_id", user.id);

    const current = modules.find((m) => m.id === moduleId);
    if (current) {
      const nextModule = modules.find((m) => m.module_index === current.module_index + 1 && m.status === "locked");
      if (nextModule) {
        await supabase
          .from("session_roadmap_modules")
          .update({ status: "current" })
          .eq("id", nextModule.id)
          .eq("user_id", user.id);
      }
    }
    fetchModules();
  }, [user, modules, fetchModules]);

  const completedCount = modules.filter((m) => m.status === "completed").length;
  const progress = modules.length > 0 ? Math.round((completedCount / modules.length) * 100) : 0;

  if (authLoading || !user || !session) {
    return (
      <div className="h-screen bg-deep-onyx text-white flex overflow-hidden">
        <div className="w-[15%] shrink-0 p-6 space-y-4">
          <div className="animate-pulse bg-white/5 rounded-2xl w-10 h-10" />
          <div className="animate-pulse bg-white/5 rounded-full h-10" />
        </div>
        <main className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-cyber-yellow border-t-transparent rounded-full animate-spin" />
        </main>
        <div className="w-[20%] shrink-0 p-6">
          <div className="animate-pulse bg-white/5 rounded-[32px] h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-deep-onyx text-white flex overflow-hidden">
      <SidebarLeft currentPage="roadmap" />

      <main className="flex-1 flex flex-col relative z-0 min-w-0 h-screen overflow-hidden">
        {/* Hero Section */}
        <div className="h-[40vh] bg-cyber-yellow text-black p-12 liquid-wave relative overflow-hidden flex flex-col justify-end">
          <div className="absolute top-10 right-10 flex gap-4">
            <div className="bg-black text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-xl">{session.title}</div>
          </div>
          <div className="max-w-3xl mb-12">
            <p className="text-sm font-bold uppercase tracking-[0.3em] mb-4 opacity-70">Mastery Path</p>
            <h1 className="text-7xl font-bold tracking-tighter leading-tight mb-4">Your Learning Roadmap</h1>
            <div className="flex items-center gap-6 mt-6">
              <div className="flex-1 h-3 bg-black/10 rounded-full overflow-hidden">
                <div className="h-full bg-black rounded-full" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-2xl font-black tracking-tighter">{progress}%</span>
            </div>
          </div>
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-black/5 rounded-full -mb-40 -mr-20" />
        </div>

        {/* Content Layer */}
        <div className="flex-1 px-12 pb-24 overflow-y-auto space-y-12 relative z-10">
          {/* Module Sequence */}
          <section>
            <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-white/40 mb-8">Module Sequence</h2>

            {loading ? (
              <div className="space-y-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-8">
                    <div className="w-10 h-10 rounded-full bg-white/5 animate-pulse shrink-0" />
                    <div className="flex-1 glass-card rounded-[24px] p-6 animate-pulse">
                      <div className="w-48 h-4 bg-white/5 rounded mb-2" />
                      <div className="w-64 h-3 bg-white/5 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : modules.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-white/30 text-sm">No roadmap modules yet. Create a session to generate one.</p>
              </div>
            ) : (
              <div className="relative pl-12 space-y-8">
                {/* Roadmap line */}
                <div className="absolute" style={{ left: "19px", top: "32px", bottom: "32px", width: "2px", background: "rgba(255,255,255,0.1)" }} />

                {modules.map((mod) => {
                  const isCompleted = mod.status === "completed";
                  const isCurrent = mod.status === "current";

                  return (
                    <div key={mod.id} className="flex items-start gap-8" style={{ position: "relative", zIndex: 10 }}>
                      {/* Status dot */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 border-deep-onyx shrink-0 ${
                        isCompleted
                          ? "bg-green-500 text-black shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                          : isCurrent
                            ? "bg-cyber-yellow text-black shadow-[0_0_30px_rgba(253,224,71,0.5)]"
                            : "bg-white/5 text-white/20"
                      }`}>
                        {isCompleted ? (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        ) : isCurrent ? (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                          </svg>
                        )}
                      </div>

                      {/* Module card */}
                      <div className={`flex-1 rounded-[24px] p-6 transition-all ${
                        isCompleted
                          ? "glass-card border-l-4 border-green-500 opacity-60"
                          : isCurrent
                            ? "glass-card border-l-4 border-cyber-yellow border-white/20"
                            : "glass-card opacity-30"
                      }`}>
                        {isCompleted ? (
                          <>
                            <h4 className="font-bold">{mod.title}</h4>
                            <p className="text-xs text-white/40">Successfully mastered</p>
                            {mod.completed_at && (
                              <p className="text-[10px] text-green-400/60 mt-1">
                                Completed {new Date(mod.completed_at).toLocaleDateString()}
                              </p>
                            )}
                          </>
                        ) : isCurrent ? (
                          <>
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="font-black text-cyber-yellow uppercase tracking-wide">{mod.title}</h4>
                              <span className="bg-cyber-yellow text-black text-[10px] px-2 py-0.5 rounded-full font-bold">CURRENT</span>
                            </div>
                            {mod.description && <p className="text-sm mb-4 text-white/60">{mod.description}</p>}
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => markComplete(mod.id)}
                                className="bg-cyber-yellow text-black text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-full hover:scale-105 active:scale-95 transition-all"
                              >
                                Mark as Complete
                              </button>
                              <button
                                onClick={() => router.push(`/${session?.slug}/chat`)}
                                className="bg-white/5 border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest px-6 py-3 rounded-full hover:bg-white/10 transition-all"
                              >
                                Resume Session
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <h4 className="font-bold">{mod.title}</h4>
                            <p className="text-xs text-white/40">Locked — complete current module to unlock</p>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>

      <SidebarRight />

      {/* Floating Notification */}
      <div className="fixed bottom-10 left-10 space-y-3 z-50">
        <div className="bg-black/80 backdrop-blur-xl border border-cyber-yellow/30 px-4 py-3 rounded-full flex items-center gap-3 shadow-2xl">
          <div className="w-2 h-2 bg-cyber-yellow rounded-full" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Roadmap Synchronized</span>
        </div>
      </div>
    </div>
  );
}
