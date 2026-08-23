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
  completed_at: string | null;
}

const SUBJECT_IMAGES: Record<string, string> = {
  physics: "/design/physics.jpg",
  maths: "/design/maths.jpg",
  math: "/design/maths.jpg",
  mathematics: "/design/maths.jpg",
  biology: "/design/biology.jpg",
  chemistry: "/design/chemistry.jpg",
  "computer science": "/design/cs.jpg",
  cs: "/design/cs.jpg",
  history: "/design/history.jpg",
  literature: "/design/literature.jpg",
  english: "/design/literature.jpg",
};

const DEFAULT_IMAGE = "/design/physics.jpg";

function getSubjectImage(subject?: string | null): string {
  if (!subject) return DEFAULT_IMAGE;
  const key = subject.toLowerCase().trim();
  return SUBJECT_IMAGES[key] || DEFAULT_IMAGE;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning,";
  if (h < 18) return "Good afternoon,";
  return "Good evening,";
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
      <div className="flex items-center justify-center h-full">
        <div className="w-5 h-5 border-2 border-sage/40 border-t-sage rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen overflow-y-auto relative" style={{ backgroundColor: "#FDFBF7" }}>
      {/* Hero subject image */}
      <div
        className="absolute top-0 left-0 right-0 z-0"
        style={{
          height: 360,
          backgroundImage: `url('${getSubjectImage(session.subject)}')`,
          backgroundSize: "cover",
          backgroundPosition: "center top",
        }}
      />

      {/* Greeting overlay */}
      <div className="absolute top-0 left-0 right-0 z-[3] px-6 lg:px-12 pt-14 pointer-events-none">
        <p className="text-[28px] lg:text-[32px] font-bold leading-tight" style={{ color: "#2D3436" }}>
          {getGreeting()}
        </p>
        <p className="text-[28px] lg:text-[32px] font-bold leading-tight" style={{ color: GREEN }}>
          {session.subject || "Student"}
        </p>
        <p className="text-[15px] lg:text-base font-medium mt-1" style={{ color: "#636E72" }}>
          Ready to learn something amazing today?
        </p>
      </div>

      {/* Content */}
      <div className="relative z-10 pt-[240px] px-4 sm:px-6 lg:px-12 pb-10 space-y-8">

        {/* Hero card */}
        <div
          className="rounded-[32px] p-6 lg:p-8"
          style={{ backgroundColor: "rgba(255,255,255,0.95)", border: "1px solid rgba(255,255,255,0.6)", boxShadow: "0 8px 24px rgba(0,0,0,0.04)" }}
        >
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="rounded-full px-3 py-1 text-[11px] font-semibold text-white max-w-[260px] truncate" style={{ backgroundColor: "#333" }}>
              {session.title}
            </span>
            <span className="rounded-full px-3 py-1 text-[11px] font-semibold" style={{ backgroundColor: "#F3EDE3", color: "#999" }}>
              {modules.length} Modules
            </span>
          </div>
          <h1 className="text-xl lg:text-2xl font-bold leading-snug mb-5" style={{ color: "#333" }}>
            {currentModule
              ? `Continue "${currentModule.title}"`
              : completedCount === modules.length && modules.length > 0
                ? "All Complete!"
                : `Welcome to ${session.subject || "your session"}`}
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#F3EDE3" }}>
              <div
                className="h-full rounded-full transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{ width: `${progress}%`, backgroundColor: GREEN }}
              />
            </div>
            <span className="text-base font-bold" style={{ color: "#333" }}>{progress}%</span>
          </div>
        </div>

        {/* Quick Actions */}
        <section>
          <p className="text-[13px] font-bold uppercase tracking-wide mb-3" style={{ color: "#999" }}>Quick Actions</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {currentModule && (
              <button
                onClick={() => startModule(currentModule.id)}
                className="bg-white rounded-[24px] p-5 text-left cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md"
                style={{ border: "1px solid #F3EDE3" }}
              >
                <div className="w-10 h-10 rounded-[14px] flex items-center justify-center mb-3" style={{ backgroundColor: "#E8F0E5" }}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={GREEN} strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
                  </svg>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-wide mb-0.5" style={{ color: "#BBB" }}>Continue</p>
                <h3 className="text-[15px] font-bold truncate" style={{ color: "#333" }}>{currentModule.title}</h3>
                <p className="text-xs mt-0.5" style={{ color: "#999" }}>Resume this module</p>
              </button>
            )}

            <button
              onClick={() => router.push(`/${session?.slug}/chat`)}
              className="bg-white rounded-[24px] p-5 text-left cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md"
              style={{ border: "1px solid #F3EDE3" }}
            >
              <div className="w-10 h-10 rounded-[14px] flex items-center justify-center mb-3" style={{ backgroundColor: "#E8F0E5" }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={GREEN} strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                </svg>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wide mb-0.5" style={{ color: "#BBB" }}>Tutor</p>
              <h3 className="text-[15px] font-bold" style={{ color: "#333" }}>Chat with Aether</h3>
              <p className="text-xs mt-0.5" style={{ color: "#999" }}>Ask anything about this subject</p>
            </button>

            <button
              onClick={() => router.push(`/${session?.slug}/progress`)}
              className="bg-white rounded-[24px] p-5 text-left cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md"
              style={{ border: "1px solid #F3EDE3" }}
            >
              <div className="w-10 h-10 rounded-[14px] flex items-center justify-center mb-3" style={{ backgroundColor: "#F3E8E8" }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#C05050" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wide mb-0.5" style={{ color: "#BBB" }}>Progress</p>
              <h3 className="text-[15px] font-bold" style={{ color: "#333" }}>Check In</h3>
              <p className="text-xs mt-0.5" style={{ color: "#999" }}>Mastery &amp; milestones</p>
            </button>

            <button
              onClick={() => router.push(`/${session?.slug}/quizzes`)}
              className="bg-white rounded-[24px] p-5 text-left cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md"
              style={{ border: "1px solid #F3EDE3" }}
            >
              <div className="w-10 h-10 rounded-[14px] flex items-center justify-center mb-3" style={{ backgroundColor: "#E8EEF3" }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#5080B0" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-6m2.25-9m-3.75 3.75h7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wide mb-0.5" style={{ color: "#BBB" }}>Quizzes</p>
              <h3 className="text-[15px] font-bold" style={{ color: "#333" }}>Test Knowledge</h3>
              <p className="text-xs mt-0.5" style={{ color: "#999" }}>Quiz on any module</p>
            </button>
          </div>
        </section>

        {/* Module Overview */}
        <section>
          <p className="text-[13px] font-bold uppercase tracking-wide mb-3" style={{ color: "#999" }}>Modules</p>
          {loading ? (
            <div className="space-y-2.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-[20px] p-4 animate-pulse" style={{ border: "1px solid #F3EDE3" }}>
                  <div className="w-40 h-3.5 bg-warm-ink/[0.04] rounded" />
                </div>
              ))}
            </div>
          ) : modules.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-[24px]" style={{ border: "1px solid #F3EDE3" }}>
              <p className="text-sm" style={{ color: "#999" }}>No modules yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {modules.map((mod) => {
                const isCompleted = mod.status === "completed";
                const isCurrent = mod.status === "current";
                const lessonCount = mod.lessons?.length || 0;

                return (
                  <div
                    key={mod.id}
                    onClick={() => isCurrent ? startModule(mod.id) : undefined}
                    className={`bg-white rounded-[20px] p-4 flex items-center gap-3 transition-all ${isCurrent ? "cursor-pointer hover:shadow-md" : ""}`}
                    style={{ border: "1px solid #F3EDE3", opacity: isCurrent ? 1 : isCompleted ? 0.65 : 0.45 }}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold"
                      style={{
                        backgroundColor: isCompleted ? "#E8F0E5" : isCurrent ? "#F3EDE3" : "#F5F5F5",
                        color: isCompleted ? GREEN : isCurrent ? GREEN : "#CCC",
                      }}
                    >
                      {isCompleted ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={GREEN} strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      ) : (
                        mod.module_index + 1
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold truncate" style={{ color: isCurrent ? "#333" : isCompleted ? "#999" : "#CCC" }}>{mod.title}</h4>
                      <p className="text-[11px]" style={{ color: "#BBB" }}>{lessonCount} lessons{isCompleted && " · Done"}</p>
                    </div>
                    {isCurrent && (
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: "#E8F0E5", color: GREEN }}>CURRENT</span>
                    )}
                    {isCurrent && (
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="#CCC" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
