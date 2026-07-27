"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "../layout";
import SidebarRight from "@/components/SidebarRight";
import SidebarLeft from "@/components/SidebarLeft";
import type { Lesson } from "@/types/database";

interface RoadmapModule {
  id: string;
  module_index: number;
  title: string;
  description: string;
  status: "completed" | "current" | "locked";
  lessons: Lesson[];
  completed_at: string | null;
}

export default function SessionDashboardPage() {
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
    if (data) {
      setModules(data.map((m) => ({
        ...m,
        lessons: typeof m.lessons === "string" ? JSON.parse(m.lessons) : (m.lessons || []),
      })) as RoadmapModule[]);
    }
    setLoading(false);
  }, [user, session]);

  useEffect(() => {
    if (user) fetchModules();
  }, [user, fetchModules]);

  const startModule = (moduleId: string) => {
    router.push(`/${session?.slug}/chat?module=${moduleId}`);
  };

  const completedCount = modules.filter((m) => m.status === "completed").length;
  const currentModule = modules.find((m) => m.status === "current");
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
      <SidebarLeft currentPage="home" />

      <main className="flex-1 flex flex-col relative z-0 min-w-0 h-screen overflow-hidden">
        {/* Hero Section */}
        <div className="h-[40vh] bg-cyber-yellow text-black p-12 liquid-wave relative overflow-hidden flex flex-col justify-end">
          <div className="absolute top-10 right-10 flex gap-4">
            <div className="bg-black text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-xl">{session.title}</div>
            <div className="bg-black/10 border border-black/10 backdrop-blur-md px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">{modules.length} Modules</div>
          </div>
          <div className="max-w-3xl mb-12">
            <p className="text-sm font-bold uppercase tracking-[0.3em] mb-4 opacity-70">Session Dashboard</p>
            <h1 className="text-7xl font-bold tracking-tighter leading-tight mb-4">
              {currentModule
                ? `Continue "${currentModule.title}"`
                : completedCount === modules.length && modules.length > 0
                  ? "All Modules Complete!"
                  : `Welcome to ${session.subject || "your session"}`}
            </h1>
            <div className="flex items-center gap-6 mt-6">
              <div className="flex-1 h-3 bg-black/10 rounded-full overflow-hidden">
                <div className="h-full bg-black rounded-full" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-2xl font-black tracking-tighter">{progress}%</span>
            </div>
          </div>
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-black/5 rounded-full -mb-40 -mr-20" />
        </div>

        {/* Content */}
        <div className="flex-1 px-12 pb-8 overflow-y-auto space-y-8 relative z-10 pt-8">

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {currentModule && (
              <button
                onClick={() => startModule(currentModule.id)}
                className="glass-card rounded-[24px] p-6 text-left hover:border-cyber-yellow/30 border-l-4 border-cyber-yellow transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <svg className="w-5 h-5 text-cyber-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                  </svg>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-cyber-yellow">Continue Learning</span>
                </div>
                <h3 className="text-lg font-bold group-hover:text-cyber-yellow transition-colors">{currentModule.title}</h3>
                <p className="text-xs text-white/40 mt-1">Start or resume this module</p>
              </button>
            )}

            <button
              onClick={() => router.push(`/${session?.slug}/roadmap`)}
              className="glass-card rounded-[24px] p-6 text-left hover:border-white/20 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3 mb-2">
                <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                </svg>
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">View Roadmap</span>
              </div>
              <h3 className="text-lg font-bold group-hover:text-purple-400 transition-colors">Learning Roadmap</h3>
              <p className="text-xs text-white/40 mt-1">{modules.length} modules, {completedCount} completed</p>
            </button>

            <button
              onClick={() => router.push(`/${session?.slug}/quizzes`)}
              className="glass-card rounded-[24px] p-6 text-left hover:border-white/20 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3 mb-2">
                <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                </svg>
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Test Knowledge</span>
              </div>
              <h3 className="text-lg font-bold group-hover:text-green-400 transition-colors">Quizzes</h3>
              <p className="text-xs text-white/40 mt-1">Take a quiz on any module</p>
            </button>
          </div>

          {/* Module Overview */}
          <section>
            <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-white/40 mb-6">Module Overview</h2>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="glass-card rounded-[20px] p-5 animate-pulse">
                    <div className="w-48 h-4 bg-white/5 rounded" />
                  </div>
                ))}
              </div>
            ) : modules.length === 0 ? (
              <div className="text-center py-12 glass-card rounded-[32px]">
                <p className="text-white/30 text-sm">No modules yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {modules.map((mod) => {
                  const isCompleted = mod.status === "completed";
                  const isCurrent = mod.status === "current";
                  const lessonCount = mod.lessons?.length || 0;

                  return (
                    <div
                      key={mod.id}
                      onClick={() => isCurrent ? startModule(mod.id) : undefined}
                      className={`glass-card rounded-[20px] p-5 flex items-center gap-4 transition-all ${
                        isCurrent ? "cursor-pointer hover:border-cyber-yellow/30 border-l-4 border-cyber-yellow" :
                        isCompleted ? "border-l-4 border-green-500 opacity-60" :
                        "opacity-30"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-black ${
                        isCompleted ? "bg-green-500 text-black" :
                        isCurrent ? "bg-cyber-yellow text-black" :
                        "bg-white/5 text-white/30"
                      }`}>
                        {isCompleted ? (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        ) : (
                          mod.module_index + 1
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm truncate">{mod.title}</h4>
                        <p className="text-xs text-white/40">{lessonCount} lessons {isCompleted && "— Completed"}</p>
                      </div>
                      {isCurrent && (
                        <span className="bg-cyber-yellow text-black text-[10px] font-bold px-3 py-1 rounded-full uppercase">Current</span>
                      )}
                      {isCurrent && (
                        <svg className="w-4 h-4 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>

      <SidebarRight />
    </div>
  );
}
