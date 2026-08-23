"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "../layout";
import type { Lesson } from "@/types/database";

const GREEN = "#6B8E61";

interface RoadmapModule {
  id: string;
  module_index: number;
  title: string;
  description: string;
  status: "completed" | "current" | "locked";
  lessons: Lesson[];
  learning_objectives: string | null;
  key_concepts: string | null;
  completed_at: string | null;
}

export default function SessionRoadmapPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { session } = useSession();
  const [modules, setModules] = useState<RoadmapModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

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

  const startModule = useCallback((moduleId: string) => {
    router.push(`/${session?.slug}/chat?module=${moduleId}`);
  }, [router, session]);

  const completedCount = modules.filter((m) => m.status === "completed").length;
  const progress = modules.length > 0 ? Math.round((completedCount / modules.length) * 100) : 0;

  if (authLoading || !user || !session) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-sage/40 border-t-sage rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen overflow-y-auto px-4 sm:px-8 lg:px-16 py-10 lg:py-14" style={{ backgroundColor: "#FDFBF7" }}>
      <div className="max-w-4xl mx-auto">
        {/* Hero */}
        <div
          className="bg-white rounded-[32px] p-5 lg:p-7 mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-4"
          style={{ border: "1px solid #F3EDE3", boxShadow: "0 8px 24px rgba(0,0,0,0.04)" }}
        >
          <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#E8F0E5" }}>
            <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke={GREEN} strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: GREEN }}>Learning Roadmap</p>
            <h1 className="text-lg lg:text-xl font-bold truncate" style={{ color: "#333" }}>{session.title}</h1>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span className="text-base font-bold" style={{ color: "#333" }}>{progress}%</span>
            <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#F3EDE3" }}>
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${progress}%`, backgroundColor: GREEN }} />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-[24px] p-8 text-center" style={{ border: "1px solid #F3EDE3" }}>
            <p className="text-sm" style={{ color: "#999" }}>Loading your roadmap...</p>
          </div>
        ) : modules.length === 0 ? (
          <div className="bg-white rounded-[24px] p-10 text-center" style={{ border: "1px solid #F3EDE3" }}>
            <p className="text-sm" style={{ color: "#999" }}>No modules yet. Create a session from the Hub.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {modules.map((mod) => {
              const isCompleted = mod.status === "completed";
              const isCurrent = mod.status === "current";
              const isExpanded = expandedModule === mod.id;
              const lessons = Array.isArray(mod.lessons) ? mod.lessons : [];
              const keyConcepts = (mod.key_concepts || "").split(",").map((c) => c.trim()).filter(Boolean);

              return (
                <div key={mod.id} className="flex gap-3 lg:gap-4">
                  {/* Timeline rail */}
                  <div className="flex flex-col items-center w-9 lg:w-10 shrink-0">
                    <div
                      className="w-9 h-9 lg:w-10 lg:h-10 rounded-full flex items-center justify-center shrink-0"
                      style={
                        isCompleted
                          ? { backgroundColor: GREEN }
                          : isCurrent
                            ? { backgroundColor: "#E8F0E5" }
                            : { backgroundColor: "#F3EDE3" }
                      }
                    >
                      {isCompleted ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#FFF" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      ) : isCurrent ? (
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: GREEN }} />
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="#CCC" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 w-0.5 my-1" style={{ backgroundColor: "#F3EDE3" }} />
                  </div>

                  {/* Module card */}
                  <div
                    onClick={() => { if (!isCompleted) setExpandedModule(isExpanded ? null : mod.id); }}
                    className={`bg-white rounded-[20px] p-4 lg:p-5 mb-4 flex-1 min-w-0 space-y-2 ${!isCompleted ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`}
                    style={{ border: "1px solid #F3EDE3", opacity: isCompleted || !isCurrent ? 0.65 : 1 }}
                  >
                    {isCompleted ? (
                      <>
                        <h4 className="text-[15px] font-bold" style={{ color: "#333" }}>{mod.title}</h4>
                        <p className="text-xs" style={{ color: "#999" }}>Successfully mastered</p>
                        {mod.completed_at && (
                          <p className="text-xs mt-0.5" style={{ color: GREEN }}>
                            Completed {new Date(mod.completed_at).toLocaleDateString()}
                          </p>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-[15px] font-bold leading-snug" style={{ color: isCurrent ? GREEN : "#333" }}>{mod.title}</h4>
                          {isCurrent && (
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0" style={{ backgroundColor: "#E8F0E5", color: GREEN }}>CURRENT</span>
                          )}
                        </div>
                        {mod.description && <p className="text-sm leading-relaxed" style={{ color: "#999" }}>{mod.description}</p>}

                        {isCurrent && lessons.length > 0 && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setExpandedModule(isExpanded ? null : mod.id); }}
                            className="flex items-center gap-1 text-xs font-semibold cursor-pointer pt-1"
                            style={{ color: GREEN }}
                          >
                            {isExpanded ? "Hide Details" : "More Details"}
                            <svg className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke={GREEN} strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                            </svg>
                          </button>
                        )}

                        {isExpanded && (
                          <div className="space-y-4 pt-3 mt-1" style={{ borderTop: "1px solid #F3EDE3" }}>
                            {mod.learning_objectives && (
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: "#BBB" }}>Learning Objectives</p>
                                <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "#666" }}>{mod.learning_objectives}</p>
                              </div>
                            )}
                            {keyConcepts.length > 0 && (
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: "#BBB" }}>Key Concepts</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {keyConcepts.map((concept, i) => (
                                    <span key={i} className="text-[11px] px-2.5 py-1 rounded-full" style={{ backgroundColor: "#F3EDE3", color: "#666" }}>
                                      {concept}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {lessons.length > 0 && (
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: "#BBB" }}>Lessons</p>
                                <div className="space-y-2">
                                  {lessons.map((lesson, li) => (
                                    <div key={li} className="rounded-2xl p-3.5 space-y-1" style={{ backgroundColor: "#F9F6F0" }}>
                                      <div className="flex items-center justify-between gap-2">
                                        <h6 className="text-[13px] font-semibold truncate" style={{ color: "#333" }}>{lesson.title}</h6>
                                        <span className="text-[10px] shrink-0" style={{ color: "#CCC" }}>{lesson.duration_minutes}m</span>
                                      </div>
                                      {lesson.description && <p className="text-xs" style={{ color: "#999" }}>{lesson.description}</p>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); startModule(mod.id); }}
                              className="w-full flex items-center justify-center gap-2 text-white text-xs font-bold rounded-[20px] py-3.5 cursor-pointer hover:brightness-105 active:scale-[0.98] transition-all"
                              style={{ backgroundColor: GREEN }}
                            >
                              START MODULE
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#FFF" strokeWidth="2.2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
