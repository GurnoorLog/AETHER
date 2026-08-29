"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "../layout";
import type { Lesson } from "@/types/database";

const SAGE = "#3F5C3A";
const INK = "#2D3436";
const MUTED = "#A9B1A7";


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

function imgFor(subject?: string | null): string {
  if (!subject) return DEFAULT_IMAGE;
  const key = subject.toLowerCase().trim();
  return SUBJECT_IMAGES[key] || DEFAULT_IMAGE;
}

function hello(): string {
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
    setGreeting(hello());
  }, []);

  const loadMods = useCallback(async () => {
    if (!user || !session) return;
    const supabase = createClient();
    const { data: rows } = await supabase
      .from("session_roadmap_modules")
      .select("*")
      .eq("session_id", session.id)
      .eq("user_id", user.id)
      .order("module_index", { ascending: true });
    if (rows) {
      const out: RoadmapModule[] = [];
      for (const m of rows) {
        out.push({
          ...m,
          lessons: typeof m.lessons === "string" ? JSON.parse(m.lessons) : (m.lessons || []),
        });
      }
      setModules(out);
    }
    setLoading(false);
  }, [user, session]);

  useEffect(() => {
    if (user) loadMods();
  }, [user, loadMods]);

  const openModule = (moduleId: string) => {
    router.push(`/${session?.slug}/chat?module=${moduleId}`);
  };

  const done = modules.filter((m) => m.status === "completed").length;
  const curMod = modules.find((m) => m.status === "current");
  const pct = modules.length > 0 ? Math.round((done / modules.length) * 100) : 0;

  if (authLoading || !user || !session) {
    return (
      <div className="flex items-center justify-center h-full" style={{ backgroundColor: "#FDFBF7" }}>
        <div className="w-6 h-6 border-2 border-[#3F5C3A]/40 border-t-[#3F5C3A] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen overflow-y-auto no-scrollbar p-6" style={{ backgroundColor: "#FDFBF7" }}>
      <div
        className="relative h-[420px] lg:h-[520px] w-full"
        style={{
              backgroundImage: `linear-gradient(rgba(253, 251, 247, 0.02), rgba(253, 251, 247, 0.02)), url('${imgFor(session.subject)}')`,
          backgroundSize: "cover",
          backgroundPosition: "center 30%",
          borderRadius: 40,
        }}
      >
        <button
          onClick={() => router.push("/hub")}
          aria-label="Back to hub"
          className="absolute top-8 left-8 bg-white/95 hover:bg-white p-2 rounded-full cursor-pointer shadow-sm transition-colors z-20"
        >
          <svg className="w-5 h-5 text-[#555E61]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>

        <div className="p-8 lg:p-12">
          <h1 className="text-[32px] lg:text-[48px] font-bold leading-[1.2] tracking-tight text-[#2D3436]">
            {greeting} <br />
            {user?.user_metadata?.full_name?.split(" ")[0] || session.subject || "Student"}
          </h1>
          <p className="text-[#7C8082] text-base lg:text-lg font-medium mt-3">
            Let&apos;s continue your learning journey.
          </p>
        </div>
        <div
          className="absolute left-8 right-8 bottom-0 translate-y-1/2 rounded-[40px] p-6 lg:p-10 border border-white/80 editorial"
          style={{ backgroundColor: "rgba(255,255,255,0.98)", backdropFilter: "blur(8px)" }}
        >
          <div className="flex items-center gap-3 mb-5 flex-wrap">
            <div className="text-white px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase max-w-[320px] truncate" style={{ backgroundColor: "#2D3436" }}>
              {session.title}
            </div>
            <div className="px-3 py-1.5 rounded-full text-[11px] font-bold" style={{ backgroundColor: "#F1E9DE", color: "#8B7E6B" }}>
              {modules.length} Modules
            </div>
          </div>

          <h2 className="text-xl lg:text-[36px] font-bold mb-6 lg:mb-8 tracking-tight text-[#2D3436] truncate">
              {curMod
                ? `Continue "${curMod.title}"`
                : done === modules.length && modules.length > 0
                  ? "All Complete!"
                  : `Welcome to ${session.subject || "your session"}`}
          </h2>

          <div className="flex items-center gap-6">
            <div className="flex-1 h-3 bg-[#F1E9DE] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${pct}%`, backgroundColor: SAGE }}
              />
            </div>
                <span className="text-xl lg:text-2xl font-bold text-[#2D3436]">{pct}%</span>
          </div>
        </div>
      </div>
      <div className="mt-28 lg:mt-32 px-2 pb-12">
        <h3 className="text-[13px] font-bold tracking-[0.2em] uppercase mb-6 px-2" style={{ color: MUTED }}>
          Start Learning
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {curMod && (
            <button
              onClick={() => openModule(curMod.id)}
              className="relative bg-white p-6 rounded-[32px] cursor-pointer text-left editorial"
              
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 editorial" style={{ backgroundColor: "#E8F1E6" }}>
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke={SAGE} strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 2v8l3-3 3 3V2" />
                </svg>
              </div>
              <p className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: MUTED }}>Continue</p>
              <h4 className="font-bold text-[17px] text-[#2D3436] truncate">{curMod.title}</h4>
              <p className="text-xs mt-1" style={{ color: MUTED }}>Resume this module</p>
              <div className="absolute bottom-6 right-6 w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: SAGE }}>
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6 7l7-7-7-7" />
                </svg>
              </div>
            </button>
          )}

          <button
            onClick={() => router.push(`/${session?.slug}/chat`)}
            className="relative bg-white p-6 rounded-[32px] cursor-pointer text-left editorial"
            
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 editorial" style={{ backgroundColor: "#E8F1E6" }}>
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke={SAGE} strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
              </svg>
            </div>
            <p className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: MUTED }}>Tutor</p>
            <h4 className="font-bold text-[17px] text-[#2D3436] truncate">Chat with Aether</h4>
            <p className="text-xs mt-1" style={{ color: MUTED }}>Ask anything about this subject</p>
            <div className="absolute bottom-6 right-6 w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: SAGE }}>
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6 7l7-7-7-7" />
              </svg>
            </div>
          </button>

          <button
            onClick={() => router.push(`/${session?.slug}/progress`)}
            className="relative bg-white p-6 rounded-[32px] cursor-pointer text-left editorial"
            
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 editorial" style={{ backgroundColor: "#FBEFF0" }}>
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="#D65F5F" strokeWidth="1.8">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
              </svg>
            </div>
            <p className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: MUTED }}>Progress</p>
            <h4 className="font-bold text-[17px] text-[#2D3436] truncate">Check In</h4>
            <p className="text-xs mt-1" style={{ color: MUTED }}>Mastery &amp; milestones</p>
            <div className="absolute bottom-6 right-6 w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: SAGE }}>
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6 7l7-7-7-7" />
              </svg>
            </div>
          </button>

          <button
            onClick={() => router.push(`/${session?.slug}/quizzes`)}
            className="relative bg-white p-6 rounded-[32px] cursor-pointer text-left editorial"
            
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 editorial" style={{ backgroundColor: "#E1EAF4" }}>
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="#5E7DA3" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 22h16" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
              </svg>
            </div>
            <p className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: MUTED }}>Quizzes</p>
            <h4 className="font-bold text-[17px] text-[#2D3436] truncate">Test Knowledge</h4>
            <p className="text-xs mt-1" style={{ color: MUTED }}>Quiz on any module</p>
            <div className="absolute bottom-6 right-6 w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: SAGE }}>
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6 7l7-7-7-7" />
              </svg>
            </div>
          </button>
        </div>
      </div>
      <div className="px-2 pb-12">
        <h3 className="text-sm font-bold uppercase tracking-widest mb-6" style={{ color: MUTED }}>
          Modules
        </h3>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-[24px] p-5 animate-pulse editorial">
                <div className="w-40 h-3.5 bg-[#EFEBE5] rounded editorial" />
              </div>
            ))}
          </div>
        ) : modules.length === 0 ? (
          <div className="bg-white rounded-[24px] p-10 text-center editorial">
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
                  onClick={() => isCurrent ? openModule(mod.id) : undefined}
                  className={`bg-white rounded-[24px] p-5 flex items-center gap-4 editorial transition-all ${isCurrent ? "cursor-pointer" : ""}`}
                  style={{ opacity: isCurrent ? 1 : isCompleted ? 0.7 : 0.45 }}
                >
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 text-sm font-bold editorial"
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