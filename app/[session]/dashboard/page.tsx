"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "../layout";
import type { Lesson } from "@/types/database";

const SAGE = "#6B8E61";
const INK = "#2D3436";
const MUTED = "#A9B1A7";
const CARD_SHADOW = "0 10px 30px -5px rgba(0, 0, 0, 0.05)";

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
  const [greeting, setGreeting] = useState("Hello,");

  useEffect(() => {
    if (!authLoading && !user) router.replace("/");
  }, [user, authLoading, router]);

  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

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
      <div className="flex items-center justify-center h-full" style={{ backgroundColor: "#FDFBF7" }}>
        <div className="w-6 h-6 border-2 border-[#6B8E61]/40 border-t-[#6B8E61] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen overflow-y-auto no-scrollbar" style={{ backgroundColor: "#FDFBF7" }}>

      {/* ── Header image & greeting ── */}
      <div
        className="relative h-[420px] lg:h-[500px] w-full p-6 lg:p-12"
        style={{
          backgroundImage: `linear-gradient(rgba(253, 251, 247, 0.02), rgba(253, 251, 247, 0.02)), url('${getSubjectImage(session.subject)}')`,
          backgroundSize: "cover",
          backgroundPosition: "center 10%",
          borderBottomLeftRadius: 48,
          borderBottomRightRadius: 48,
        }}
      >
        {/* Back to hub */}
        <button
          onClick={() => router.push("/hub")}
          aria-label="Back to hub"
          className="absolute top-8 left-8 bg-white/90 hover:bg-white p-2 rounded-full cursor-pointer shadow-sm transition-colors z-10"
        >
          <svg className="w-5 h-5 text-[#555E61]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>

        <div className="mt-8 lg:mt-4">
          <h1 className="text-[32px] lg:text-[48px] font-bold leading-tight text-[#2D3436]">
            {greeting} <br />
            <span style={{ color: SAGE }}>{session.subject || "Student"}</span>
          </h1>
          <p className="text-[#555E61] text-base lg:text-lg font-medium mt-2">
            Ready to learn something amazing today?
          </p>
        </div>

        {/* ── Hero course card (overlapping) ── */}
        <div
          className="absolute left-6 right-6 lg:left-12 lg:right-12 bottom-[-90px] rounded-[36px] lg:rounded-[48px] p-6 lg:p-10 border border-white/80"
          style={{ backgroundColor: "rgba(255,255,255,0.95)", backdropFilter: "blur(10px)", boxShadow: CARD_SHADOW }}
        >
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="text-white px-4 py-1.5 rounded-full text-xs font-bold tracking-tight uppercase max-w-[320px] truncate" style={{ backgroundColor: "#2D3436" }}>
              {session.title}
            </div>
            <div className="px-3 py-1.5 rounded-full text-xs font-bold" style={{ backgroundColor: "#F1E9DE", color: "#8B7E6B" }}>
              {modules.length} Modules
            </div>
          </div>

          <h2 className="text-xl lg:text-3xl font-bold mb-6 text-[#2D3436] truncate">
            {currentModule
              ? `Continue "${currentModule.title}"`
              : completedCount === modules.length && modules.length > 0
                ? "All Complete!"
                : `Welcome to ${session.subject || "your session"}`}
          </h2>

          <div className="flex items-center gap-6">
            <div className="flex-1 h-3 bg-[#F1E9DE] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${progress}%`, backgroundColor: SAGE }}
              />
            </div>
            <span className="text-lg lg:text-xl font-bold text-[#2D3436]">{progress}%</span>
          </div>
        </div>
      </div>

      {/* ── Quick actions ── */}
      <div className="mt-28 lg:mt-32 px-6 lg:px-12 pb-12">
        <h3 className="text-sm font-bold uppercase tracking-widest mb-6" style={{ color: MUTED }}>
          Quick Actions
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {currentModule && (
            <button
              onClick={() => startModule(currentModule.id)}
              className="bg-white p-6 rounded-[32px] border border-[#EFEBE5] hover:scale-[1.02] transition-transform cursor-pointer text-left"
              style={{ boxShadow: CARD_SHADOW }}
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6" style={{ backgroundColor: "#E8F1E6" }}>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke={SAGE} strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                </svg>
              </div>
              <p className="text-xs font-bold uppercase" style={{ color: MUTED }}>Continue</p>
              <h4 className="font-bold text-lg text-[#2D3436] truncate">{currentModule.title}</h4>
              <p className="text-sm" style={{ color: MUTED }}>Resume this module</p>
            </button>
          )}

          <button
            onClick={() => router.push(`/${session?.slug}/chat`)}
            className="bg-white p-6 rounded-[32px] border border-[#EFEBE5] hover:scale-[1.02] transition-transform cursor-pointer text-left"
            style={{ boxShadow: CARD_SHADOW }}
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6" style={{ backgroundColor: "#E8F1E6" }}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke={SAGE} strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
              </svg>
            </div>
            <p className="text-xs font-bold uppercase" style={{ color: MUTED }}>Tutor</p>
            <h4 className="font-bold text-lg text-[#2D3436]">Chat with Aether</h4>
            <p className="text-sm" style={{ color: MUTED }}>Ask anything about this subject</p>
          </button>

          <button
            onClick={() => router.push(`/${session?.slug}/progress`)}
            className="bg-white p-6 rounded-[32px] border border-[#EFEBE5] hover:scale-[1.02] transition-transform cursor-pointer text-left"
            style={{ boxShadow: CARD_SHADOW }}
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6" style={{ backgroundColor: "#F1E9DE" }}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="#8B7E6B" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
            <p className="text-xs font-bold uppercase" style={{ color: MUTED }}>Progress</p>
            <h4 className="font-bold text-lg text-[#2D3436]">Check In</h4>
            <p className="text-sm" style={{ color: MUTED }}>Mastery &amp; milestones</p>
          </button>

          <button
            onClick={() => router.push(`/${session?.slug}/quizzes`)}
            className="bg-white p-6 rounded-[32px] border border-[#EFEBE5] hover:scale-[1.02] transition-transform cursor-pointer text-left"
            style={{ boxShadow: CARD_SHADOW }}
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6" style={{ backgroundColor: "#E1EAF4" }}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="#5E7DA3" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
              </svg>
            </div>
            <p className="text-xs font-bold uppercase" style={{ color: MUTED }}>Quizzes</p>
            <h4 className="font-bold text-lg text-[#2D3436]">Test Knowledge</h4>
            <p className="text-sm" style={{ color: MUTED }}>Quiz on any module</p>
          </button>
        </div>
      </div>

      {/* ── Modules ── */}
      <div className="px-6 lg:px-12 pb-16">
        <h3 className="text-sm font-bold uppercase tracking-widest mb-6" style={{ color: MUTED }}>
          Modules
        </h3>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-[24px] p-5 border border-[#EFEBE5] animate-pulse" style={{ boxShadow: CARD_SHADOW }}>
                <div className="w-40 h-3.5 bg-[#EFEBE5] rounded" />
              </div>
            ))}
          </div>
        ) : modules.length === 0 ? (
          <div className="bg-white rounded-[24px] p-10 text-center border border-[#EFEBE5]" style={{ boxShadow: CARD_SHADOW }}>
            <p className="text-sm text-[#A9B1A7]">No modules yet.</p>
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
                  className={`bg-white rounded-[24px] p-5 flex items-center gap-4 border border-[#EFEBE5] transition-all ${isCurrent ? "cursor-pointer hover:border-[#CFDFC9]" : ""}`}
                  style={{ boxShadow: CARD_SHADOW, opacity: isCurrent ? 1 : isCompleted ? 0.7 : 0.45 }}
                >
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 text-sm font-bold"
                    style={{
                      backgroundColor: isCompleted ? "#E8F1E6" : isCurrent ? SAGE : "#EFEBE5",
                      color: isCompleted ? SAGE : isCurrent ? "#FFFFFF" : "#A0A5A8",
                    }}
                  >
                    {isCompleted ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={SAGE} strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    ) : (
                      mod.module_index + 1
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-[#2D3436] truncate">{mod.title}</h4>
                    <p className="text-xs text-[#A9B1A7] mt-0.5">{lessonCount} lessons{isCompleted && " · Done"}</p>
                  </div>
                  {isCurrent && (
                    <>
                      <span className="text-[10px] font-bold uppercase tracking-wide px-3 py-1 rounded-full shrink-0" style={{ backgroundColor: "#E8F1E6", color: SAGE }}>
                        Current
                      </span>
                      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="#A0A5A8" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
