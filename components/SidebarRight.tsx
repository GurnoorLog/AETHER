"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { usePlayer } from "@/providers/PlayerProvider";
import { useSession } from "@/app/[session]/layout";
import { createClient } from "@/lib/supabase/client";
import { X } from "lucide-react";
import type { GeneratedTrack } from "@/types/database";

const SAGE = "#6B8E61";

export default function SidebarRight() {
  const { user } = useAuth();
  const { session } = useSession();
  const { currentTrack, isPlaying, togglePlay, play } = usePlayer();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ full_name: string } | null>(null);
  const [subjects, setSubjects] = useState<{ subject: string; mastery_level: number }[]>([]);
  const [memories, setMemories] = useState<{ content: string; context: string }[]>([]);
  const [documents, setDocuments] = useState<{ id: string; filename: string; status?: string }[]>([]);
  const [latestTrack, setLatestTrack] = useState<GeneratedTrack | null>(null);
  const [messageCount, setMessageCount] = useState(0);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    if (!user || !session) return;

    const fetchData = async () => {
      try {
        const { data: convs } = await supabase
          .from("conversations")
          .select("id")
          .eq("session_id", session.id)
          .eq("user_id", user.id);

        const convIds = (convs ?? []).map((c: { id: string }) => c.id);

        const [profileRes, subjectsRes, memoriesRes, docsRes, tracksRes, msgCountRes] = await Promise.all([
          supabase.from("user_profiles").select("full_name").eq("user_id", user.id).single(),
          supabase.from("progress_tracking").select("subject, mastery_level").eq("user_id", user.id).eq("session_id", session.id),
          supabase.from("ai_memories").select("content, context").eq("user_id", user.id).order("created_at", { ascending: false }).limit(3),
          supabase.from("documents").select("id, filename, status").eq("user_id", user.id).eq("session_id", session.id).order("uploaded_at", { ascending: false }).limit(5),
          supabase.from("generated_tracks").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
          convIds.length > 0
            ? supabase.from("chat_messages").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("role", "user").in("conversation_id", convIds)
            : Promise.resolve({ count: 0 }),
        ]);

        if (profileRes.data) setProfile(profileRes.data as { full_name: string });
        if (subjectsRes.data) setSubjects(subjectsRes.data as { subject: string; mastery_level: number }[]);
        if (memoriesRes.data) setMemories(memoriesRes.data as { content: string; context: string }[]);
        if (docsRes.data) setDocuments(docsRes.data as { id: string; filename: string; status?: string }[]);
        if (tracksRes.data) setLatestTrack(tracksRes.data as GeneratedTrack);
        setMessageCount(msgCountRes.count ?? 0);
      } catch {
        // ignore
      }
      setLoading(false);
    };

    fetchData();
  }, [user, session]);

  useEffect(() => {
    const toggleHandler = () => setIsMobileOpen((prev) => !prev);
    const openHandler = () => setIsMobileOpen(true);
    const closeHandler = () => setIsMobileOpen(false);
    window.addEventListener("toggle-mobile-sidebar", toggleHandler);
    window.addEventListener("open-mobile-sidebar", openHandler);
    window.addEventListener("close-mobile-sidebar", closeHandler);
    return () => {
      window.removeEventListener("toggle-mobile-sidebar", toggleHandler);
      window.removeEventListener("open-mobile-sidebar", openHandler);
      window.removeEventListener("close-mobile-sidebar", closeHandler);
    };
  }, []);

  const masteryTotal = subjects.length > 0
    ? Math.round(subjects.reduce((sum, s) => sum + s.mastery_level, 0) / subjects.length)
    : 0;

  const studyHours = ((messageCount * 2) / 60).toFixed(1);
  const estimatedXP = messageCount * 10 + documents.length * 25;

  const indexingDocs = documents.filter((d) => d.status === "INDEXING");
  const readyDocs = documents.filter((d) => d.status === "READY" || !d.status);
  const displayTrack = currentTrack || latestTrack;

  const circumference = 2 * Math.PI * 88;
  const dashOffset = circumference - (circumference * masteryTotal / 100);

  const sidebarContent = (
    <>
      {loading ? (
        <>
          <div className="animate-pulse bg-white rounded-[24px] border border-[#EFEBE5] h-64" />
          <div className="animate-pulse bg-white rounded-[24px] border border-[#EFEBE5] h-28" />
          <div className="animate-pulse bg-white rounded-[24px] border border-[#EFEBE5] h-28" />
        </>
      ) : (
        <div className="flex flex-col h-full space-y-10">
          {/* ── Daily Mastery ── */}
          <div>
            <p className="text-center text-[11px] font-bold tracking-[0.25em] uppercase mb-8 text-[#A0A5A8]">Daily Mastery</p>
            <div className="relative flex items-center justify-center">
              <svg className="w-52 h-52 -rotate-90">
                <circle cx="104" cy="104" r="88" stroke="#F1E9DE" strokeWidth="4" fill="transparent" />
                <circle
                  cx="104" cy="104" r="88"
                  fill="transparent"
                  stroke={SAGE}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  className="transition-all duration-1000"
                />
                <circle cx="104" cy="16" r="4.5" fill={SAGE} />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-[56px] font-bold leading-none text-[#2D3436]">{masteryTotal}%</span>
                <span className="text-[#A0A5A8] text-[11px] font-bold tracking-[0.1em] mt-1">MASTERY</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mt-12 text-center">
              <div>
                <p className="text-[#A0A5A8] text-[10px] font-bold uppercase tracking-widest mb-1">Study</p>
                <p className="text-[24px] font-bold text-[#2D3436]">{studyHours}h</p>
              </div>
              <div>
                <p className="text-[#A0A5A8] text-[10px] font-bold uppercase tracking-widest mb-1">XP</p>
                <p className="text-[24px] font-bold" style={{ color: SAGE }}>+{estimatedXP}</p>
              </div>
            </div>
          </div>

          {/* ── Memory Log ── */}
          {memories.length > 0 && (
            <div>
              <p className="text-xs font-bold tracking-widest uppercase mb-4 text-[#A0A5A8]">Memory Log</p>
              <div className="space-y-3">
                {memories.map((m, i) => (
                  <div key={i} className="bg-white rounded-[32px] p-5 border border-[#EFEBE5] shadow-[0_10px_30px_-5px_rgba(0,0,0,0.05)] flex items-center gap-4">
                    <div className="w-11 h-11 shrink-0 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#E8F1E6" }}>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={SAGE} strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm leading-snug text-[#2D3436]"><span className="font-bold">{m.content}</span></p>
                      <p className="text-[10px] font-bold uppercase tracking-wide mt-0.5" style={{ color: SAGE }}>{m.context}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Recent Files ── */}
          {(indexingDocs.length > 0 || readyDocs.length > 0) && (
            <div>
              <p className="text-xs font-bold tracking-widest uppercase mb-4 text-[#A0A5A8]">Recent Files</p>
              <div className="space-y-3">
                {indexingDocs.slice(0, 2).map((doc) => (
                  <div key={doc.id} className="bg-white rounded-[32px] p-5 border border-[#EFEBE5] shadow-[0_10px_30px_-5px_rgba(0,0,0,0.05)] flex items-center gap-3">
                    <div className="w-11 h-11 shrink-0 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#E1EAF4" }}>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#5E7DA3" strokeWidth="1.8">
                        <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate text-[#2D3436]">{doc.filename}</p>
                      <div className="w-full h-1 bg-[#EFEBE5] rounded-full mt-2 overflow-hidden">
                        <div className="h-full rounded-full shimmer" style={{ width: "60%", backgroundColor: SAGE }} />
                      </div>
                    </div>
                  </div>
                ))}
                {readyDocs.slice(0, 2).map((doc) => (
                  <div key={doc.id} className="bg-white rounded-[32px] p-5 border border-[#EFEBE5] shadow-[0_10px_30px_-5px_rgba(0,0,0,0.05)] flex items-center gap-3">
                    <div className="w-11 h-11 shrink-0 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#E8F1E6" }}>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={SAGE} strokeWidth="1.8">
                        <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate text-[#2D3436]">{doc.filename}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-[#A0A5A8] mt-0.5">Ready</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Focus Music ── */}
          <div className="flex-1 flex flex-col min-h-[220px]">
            {displayTrack ? (
              <div className="bg-white rounded-[40px] p-8 border border-[#EFEBE5] shadow-[0_10px_30px_-5px_rgba(0,0,0,0.05)] flex-1 flex flex-col justify-center">
                <button onClick={() => play(displayTrack)} className="text-left cursor-pointer mb-6">
                  <p className="text-sm font-bold text-[#2D3436] truncate">{displayTrack.title}</p>
                  <p className="text-xs text-[#A0A5A8]">{displayTrack.mood} · {displayTrack.instrument}</p>
                </button>
                <div className="flex items-center justify-center gap-6">
                  <button className="text-[#A0A5A8] hover:text-[#2D3436] transition-colors cursor-pointer">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path d="M21 16.811c0 .864-.933 1.405-1.683.977l-7.108-4.062a1.125 1.125 0 010-1.953l7.108-4.062A1.125 1.125 0 0121 8.688v8.123zM11.25 16.811c0 .864-.933 1.405-1.683.977l-7.108-4.062a1.125 1.125 0 010-1.953L9.567 7.71a1.125 1.125 0 011.683.977v8.123z" />
                    </svg>
                  </button>
                  <button
                    onClick={togglePlay}
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white hover:brightness-105 active:scale-95 transition-all cursor-pointer"
                    style={{ backgroundColor: SAGE, boxShadow: "0 10px 24px rgba(107,142,97,0.35)" }}
                  >
                    {isPlaying ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                      </svg>
                    )}
                  </button>
                  <button className="text-[#A0A5A8] hover:text-[#2D3436] transition-colors cursor-pointer">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path d="M3 8.688c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062A1.125 1.125 0 013 16.811V8.688zM12.75 8.688c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062a1.125 1.125 0 01-1.683-.977V8.688z" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <a
                href="/music"
                className="bg-white rounded-[40px] p-8 border border-[#EFEBE5] shadow-[0_10px_30px_-5px_rgba(0,0,0,0.05)] flex-1 flex flex-col items-center justify-center text-center hover:border-[#DDE7DB] transition-colors"
              >
                <svg className="w-14 h-14 mb-5 opacity-10" fill="none" viewBox="0 0 24 24" stroke={SAGE} strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
                </svg>
                <p className="text-lg font-bold text-[#2D3436] mb-10">Generate focus music</p>
                <span
                  className="w-full flex items-center justify-center gap-2 text-white font-bold py-4 rounded-2xl hover:brightness-105 transition-all"
                  style={{ backgroundColor: SAGE, boxShadow: "0 10px 24px rgba(107,142,97,0.25)" }}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                  </svg>
                  Generate
                </span>
              </a>
            )}
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="sidebar-desktop w-[340px] shrink-0 h-screen p-10 overflow-y-auto text-[#2D3436]" style={{ backgroundColor: "#FDFBF7" }}>
        {sidebarContent}
      </aside>

      {/* Mobile backdrop overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-[#2D3436]/30 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile drawer — slides in from right */}
      <div
        className={[
          "sidebar-mobile",
          "fixed top-0 right-0 h-full w-[85vw] max-w-sm z-50",
          "border-l border-[#EFEBE5] text-[#2D3436]",
          "transform transition-transform duration-300 ease-in-out",
          "overflow-y-auto",
          isMobileOpen ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
        style={{ backgroundColor: "#FDFBF7" }}
      >
        <button
          onClick={() => setIsMobileOpen(false)}
          className="absolute top-3 right-3 z-10 p-2 text-[#A0A5A8] hover:text-[#2D3436] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
        <aside className="h-full flex flex-col p-6 space-y-8 overflow-y-auto pt-10">
          {sidebarContent}
        </aside>
      </div>
    </>
  );
}
