"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { usePlayer } from "@/providers/PlayerProvider";
import { createClient } from "@/lib/supabase/client";
import type { GeneratedTrack } from "@/types/database";

export default function SidebarRight() {
  const { user } = useAuth();
  const { currentTrack, isPlaying, togglePlay, play } = usePlayer();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ full_name: string } | null>(null);
  const [subjects, setSubjects] = useState<{ subject: string; mastery_level: number }[]>([]);
  const [memories, setMemories] = useState<{ content: string; context: string }[]>([]);
  const [documents, setDocuments] = useState<{ id: string; filename: string; status?: string }[]>([]);
  const [latestTrack, setLatestTrack] = useState<GeneratedTrack | null>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("user_profiles").select("full_name").eq("user_id", user.id).single(),
      supabase.from("progress_tracking").select("subject, mastery_level").eq("user_id", user.id),
      supabase.from("ai_memories").select("content, context").eq("user_id", user.id).order("created_at", { ascending: false }).limit(3),
      supabase.from("documents").select("id, filename, status").eq("user_id", user.id).order("uploaded_at", { ascending: false }).limit(5),
      supabase.from("generated_tracks").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]).then(([profileRes, subjectsRes, memoriesRes, docsRes, tracksRes]) => {
      if (profileRes.data) setProfile(profileRes.data as { full_name: string });
      if (subjectsRes.data) setSubjects(subjectsRes.data as { subject: string; mastery_level: number }[]);
      if (memoriesRes.data) setMemories(memoriesRes.data as { content: string; context: string }[]);
      if (docsRes.data) setDocuments(docsRes.data as { id: string; filename: string; status?: string }[]);
      if (tracksRes.data) setLatestTrack(tracksRes.data as GeneratedTrack);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  const masteryTotal = subjects.length > 0
    ? Math.round(subjects.reduce((sum, s) => sum + s.mastery_level, 0) / subjects.length)
    : 0;

  const indexingDocs = documents.filter((d) => d.status === "INDEXING");
  const readyDocs = documents.filter((d) => d.status === "READY" || !d.status);

  const displayTrack = currentTrack || latestTrack;

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-white/5 rounded-2xl ${className ?? ""}`} />;
}

  return (
    <div className="w-[20%] shrink-0">
      <aside className="h-full flex flex-col p-6 space-y-6 border-l border-white/5 bg-deep-onyx overflow-y-auto">
        {loading ? (
          <>
            <Skeleton className="h-64 rounded-[32px]" />
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-[32px] mt-auto" />
          </>
        ) : (
          <>
            <div className="glass-card rounded-[32px] p-6 text-center">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-4">Daily Mastery</h4>
              <div className="relative w-32 h-32 mx-auto flex items-center justify-center mb-4">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="64" cy="64" r="58" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-white/5" />
                  <circle cx="64" cy="64" r="58" fill="transparent" stroke="currentColor" strokeWidth="8" strokeDasharray="364" strokeDashoffset={364 - (364 * masteryTotal / 100)} className="text-cyber-yellow transition-all duration-500" />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-black">{masteryTotal}%</span>
                  <span className="text-[8px] uppercase tracking-widest text-white/40">Complete</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="bg-white/5 rounded-2xl p-3">
                  <p className="text-[8px] text-white/40 uppercase mb-1">Study Time</p>
                  <p className="text-sm font-bold">{(masteryTotal / 10).toFixed(1)} hrs</p>
                </div>
                <div className="bg-white/5 rounded-2xl p-3">
                  <p className="text-[8px] text-white/40 uppercase mb-1">New XP</p>
                  <p className="text-sm font-bold text-cyber-yellow">+{masteryTotal * 12}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/40 pl-2">Memory Log</h4>
              {memories.length > 0 ? memories.map((m, i) => (
                <div key={i} className="glass-card rounded-2xl p-4 flex gap-3 items-start">
                  <span className="text-xl">{i === 0 ? "\u{1F9E0}" : "\u{1F3A8}"}</span>
                  <div>
                    <p className="text-xs font-medium">{m.content}</p>
                    <p className="text-[10px] text-cyber-yellow mt-1">{m.context}</p>
                  </div>
                </div>
              )) : null}
            </div>

            <div className="space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/40 pl-2">Indexing Files</h4>
              {indexingDocs.slice(0, 3).map((doc) => (
                <div key={doc.id} className="bg-charcoal rounded-2xl p-4 border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    <div>
                      <p className="text-[10px] font-bold max-w-[120px] truncate">{doc.filename}</p>
                      <div className="w-20 h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-cyber-yellow rounded-full shimmer" style={{ width: "60%" }} />
                      </div>
                    </div>
                  </div>
                  <span className="text-[8px] font-bold uppercase text-cyber-yellow shrink-0">Indexing</span>
                </div>
              ))}
              {readyDocs.slice(0, 3).map((doc) => (
                <div key={doc.id} className="bg-charcoal rounded-2xl p-4 border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    <div>
                      <p className="text-[10px] font-bold max-w-[120px] truncate">{doc.filename}</p>
                      <p className="text-[8px] text-white/30">Ready to analyze</p>
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              ))}
            </div>

            <div className="glass-card rounded-[32px] p-6 mt-auto border border-cyber-yellow/20 shadow-[0_0_30px_rgba(253,224,71,0.05)]">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-cyber-yellow">
                  {displayTrack ? "Now Playing" : "Focus Ambience"}
                </h4>
                <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                </svg>
              </div>
              {displayTrack ? (
              <>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-cyber-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
                    </svg>
                  </div>
                  <div className="cursor-pointer" onClick={() => play(displayTrack)}>
                    <p className="text-xs font-bold">{displayTrack.title}</p>
                    <p className="text-[10px] text-white/40">{displayTrack.mood} \u2022 {displayTrack.instrument}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <button className="cursor-pointer hover:text-cyber-yellow transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path d="M21 16.811c0 .864-.933 1.405-1.683.977l-7.108-4.062a1.125 1.125 0 010-1.953l7.108-4.062A1.125 1.125 0 0121 8.688v8.123zM11.25 16.811c0 .864-.933 1.405-1.683.977l-7.108-4.062a1.125 1.125 0 010-1.953L9.567 7.71a1.125 1.125 0 011.683.977v8.123z" />
                    </svg>
                  </button>
                  <button onClick={togglePlay} className="cursor-pointer hover:text-cyber-yellow transition-colors">
                    {isPlaying ? (
                      <svg className="w-6 h-6 text-cyber-yellow" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-cyber-yellow" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                      </svg>
                    )}
                  </button>
                  <button className="cursor-pointer hover:text-cyber-yellow transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path d="M3 8.688c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062A1.125 1.125 0 013 16.811V8.688zM12.75 8.688c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062a1.125 1.125 0 01-1.683-.977V8.688z" />
                      </svg>
                    </button>
                  </div>
                </>
              ) : (
                <a href="/music" className="block">
                  <div className="flex flex-col items-center gap-3 py-6">
                    <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-cyber-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
                      </svg>
                    </div>
                    <p className="text-xs font-bold text-center">Let's get some vibes in here</p>
                    <p className="text-[10px] text-white/40 text-center">Generate your first focus track</p>
                    <span className="bg-cyber-yellow text-black text-[10px] font-bold px-4 py-2 rounded-full mt-1">Go to Music</span>
                  </div>
                </a>
              )}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
