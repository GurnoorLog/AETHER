"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { usePlayer } from "@/providers/PlayerProvider";
import { useSession } from "@/app/[session]/layout";
import { createClient } from "@/lib/supabase/client";
import { PanelRightClose } from "lucide-react";
import type { GeneratedTrack } from "@/types/database";

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

  const circumference = 2 * Math.PI * 56;
  const dashOffset = circumference - (circumference * masteryTotal / 100);

  const sidebarContent = (
    <>
      {loading ? (
        <>
          <div className="animate-pulse bg-white/[0.03] rounded-[24px] h-64" />
          <div className="animate-pulse bg-white/[0.03] rounded-2xl h-28" />
          <div className="animate-pulse bg-white/[0.03] rounded-2xl h-28" />
        </>
      ) : (
        <>
          {/* Mastery Ring */}
          <div className="glass-card rounded-[24px] p-5 text-center">
            <p className="label-micro text-white/30 mb-4">Daily Mastery</p>
            <div className="relative w-28 h-28 mx-auto flex items-center justify-center mb-4">
              <svg className="w-full h-full -rotate-90">
                <circle cx="56" cy="56" r="56" fill="transparent" stroke="rgba(255,255,255,0.04)" strokeWidth="7" />
                <circle
                  cx="56" cy="56" r="56"
                  fill="transparent"
                  stroke="#FDE047"
                  strokeWidth="7"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-2xl font-bold tracking-tight">{masteryTotal}%</span>
                <span className="text-[8px] uppercase tracking-widest text-white/25">mastery</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/[0.03] rounded-xl p-3 text-center">
                <p className="text-[9px] text-white/30 uppercase tracking-wider mb-0.5">Study</p>
                <p className="text-sm font-semibold">{studyHours}h</p>
              </div>
              <div className="bg-white/[0.03] rounded-xl p-3 text-center">
                <p className="text-[9px] text-white/30 uppercase tracking-wider mb-0.5">XP</p>
                <p className="text-sm font-semibold text-cyber-yellow">+{estimatedXP}</p>
              </div>
            </div>
          </div>

          {/* Memory Log */}
          {memories.length > 0 && (
            <div className="space-y-2.5">
              <p className="label-micro text-white/25 pl-1">Memory Log</p>
              {memories.map((m, i) => (
                <div key={i} className="glass-card rounded-2xl p-3.5 flex gap-3 items-start">
                  <div className="w-7 h-7 rounded-lg bg-white/[0.03] flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-3.5 h-3.5 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-white/70 leading-snug">{m.content}</p>
                    <p className="text-[9px] text-cyber-yellow/60 mt-1">{m.context}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Files */}
          {(indexingDocs.length > 0 || readyDocs.length > 0) && (
            <div className="space-y-2.5">
              <p className="label-micro text-white/25 pl-1">Recent Files</p>
              {indexingDocs.slice(0, 2).map((doc) => (
                <div key={doc.id} className="glass-card rounded-xl p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium truncate">{doc.filename}</p>
                    <div className="w-full h-1 bg-white/[0.04] rounded-full mt-1.5 overflow-hidden">
                      <div className="h-full bg-cyber-yellow/60 rounded-full shimmer" style={{ width: "60%" }} />
                    </div>
                  </div>
                </div>
              ))}
              {readyDocs.slice(0, 2).map((doc) => (
                <div key={doc.id} className="glass-card rounded-xl p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium truncate">{doc.filename}</p>
                    <p className="text-[9px] text-white/20">Ready</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Music Player */}
          <div className="glass-card rounded-[24px] p-5 mt-auto">
            <div className="flex items-center justify-between mb-4">
              <p className="label-micro text-white/30">
                {displayTrack ? "Now Playing" : "Focus Music"}
              </p>
              <svg className="w-4 h-4 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
              </svg>
            </div>
            {displayTrack ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 bg-cyber-yellow/10 rounded-xl flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-cyber-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
                    </svg>
                  </div>
                  <div className="cursor-pointer min-w-0" onClick={() => play(displayTrack)}>
                    <p className="text-[11px] font-semibold truncate">{displayTrack.title}</p>
                    <p className="text-[9px] text-white/30">{displayTrack.mood} · {displayTrack.instrument}</p>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-6">
                  <button className="text-white/30 hover:text-white/60 transition-colors cursor-pointer">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path d="M21 16.811c0 .864-.933 1.405-1.683.977l-7.108-4.062a1.125 1.125 0 010-1.953l7.108-4.062A1.125 1.125 0 0121 8.688v8.123zM11.25 16.811c0 .864-.933 1.405-1.683.977l-7.108-4.062a1.125 1.125 0 010-1.953L9.567 7.71a1.125 1.125 0 011.683.977v8.123z" />
                    </svg>
                  </button>
                  <button onClick={togglePlay} className="w-10 h-10 rounded-full bg-cyber-yellow flex items-center justify-center text-black hover:scale-105 active:scale-95 transition-all cursor-pointer">
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
                  <button className="text-white/30 hover:text-white/60 transition-colors cursor-pointer">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path d="M3 8.688c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062A1.125 1.125 0 013 16.811V8.688zM12.75 8.688c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062a1.125 1.125 0 01-1.683-.977V8.688z" />
                    </svg>
                  </button>
                </div>
              </>
            ) : (
              <a href="/music" className="block group">
                <div className="flex flex-col items-center gap-2.5 py-4">
                  <div className="w-11 h-11 bg-cyber-yellow/10 rounded-xl flex items-center justify-center group-hover:bg-cyber-yellow/15 transition-colors">
                    <svg className="w-5 h-5 text-cyber-yellow/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
                    </svg>
                  </div>
                  <p className="text-[11px] font-medium text-white/50 text-center">Generate focus music</p>
                  <span className="btn-ghost text-[9px] px-4 py-1.5">Open Music</span>
                </div>
              </a>
            )}
          </div>
        </>
      )}
    </>
  );

  return (
    <>
      {/* Desktop — exact same layout and behavior */}
      <div className="sidebar-desktop w-[20%] shrink-0 h-screen">
        <aside className="h-full flex flex-col p-5 space-y-5 border-l border-white/[0.04] bg-deep-onyx overflow-y-auto">
          {sidebarContent}
        </aside>
      </div>

      {/* Mobile backdrop overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile drawer — slides in from right */}
      <div
        className={[
          "sidebar-mobile",
          "fixed top-0 right-0 h-full w-[85vw] max-w-sm z-50",
          "bg-deep-onyx border-l border-white/[0.04]",
          "transform transition-transform duration-300 ease-in-out",
          "overflow-y-auto",
          isMobileOpen ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
      >
        <button
          onClick={() => setIsMobileOpen(false)}
          className="absolute top-3 right-3 z-10 p-2 text-white/50 hover:text-white transition-colors cursor-pointer"
        >
          <PanelRightClose className="w-5 h-5" />
        </button>
        <aside className="h-full flex flex-col p-5 space-y-5 overflow-y-auto">
          {sidebarContent}
        </aside>
      </div>
    </>
  );
}
