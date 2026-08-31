"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import CreateSessionModal from "@/components/CreateSessionModal";

interface Subject {
  subject: string;
  mastery_level: number;
}

interface Conversation {
  id: string;
  slug?: string;
  title: string;
  subject?: string;
  created_at: string;
  updated_at: string;
}

function subjFromTitle(title: string): string {
  const match = title.match(/^(.+?) Study Session$/);
  if (match) return match[1];
  return title;
}

function subjInitial(subject: string): string {
  return (subject || "?").trim().charAt(0).toUpperCase();
}


function subjProgress(subject: string, subjects: Subject[]): number {
  const found = subjects.find((s) => s.subject === subject);
  if (found) return found.mastery_level;
  return 0;
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const EDITORIAL_ACCENTS = ["#3F5C3A", "#C9772E", "#2D3436"];
function subjAccent(subject: string): string {
  let h = 0;
  const key = subject || "";
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return EDITORIAL_ACCENTS[h % EDITORIAL_ACCENTS.length];
}

const STAT_COLORS = [
  { bg: "#E8F0E5", icon: "#3F5C3A", value: "#2D3436" },
  { bg: "#E8F0E5", icon: "#3F5C3A", value: "#2D3436" },
  { bg: "#E8F0E5", icon: "#3F5C3A", value: "#2D3436" },
  { bg: "#E8F0E5", icon: "#3F5C3A", value: "#2D3436" },
];

function greet(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function HubPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [greeting, setGreeting] = useState("Hello");

  const grab = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    const [sr, sessRes] = await Promise.all([
      supabase.from("progress_tracking").select("subject, mastery_level").eq("user_id", user.id),
      supabase
        .from("sessions")
        .select("id, title, slug, subject, created_at, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false }),
    ]);
    if (sr.data) setSubjects(sr.data as Subject[]);
    if (sessRes.data) setConversations(sessRes.data as Conversation[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/");
  }, [user, authLoading, router]);

  useEffect(() => {
    setGreeting(greet());
  }, []);

  useEffect(() => {
    if (user) grab();
  }, [user, grab]);

  const withSubj: Array<Omit<Conversation, "subject"> & { subject: string; progress: number }> = [];
  for (const conv of conversations) {
    const subj = subjFromTitle(conv.title);
    withSubj.push({
      ...conv,
      subject: subj,
      progress: subjProgress(subj, subjects),
    });
  }

  const filtered = withSubj.filter((s) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "active" && s.progress < 100) ||
      (filter === "completed" && s.progress >= 100);
    return matchesFilter;
  });

  let mastery = 0;
  if (subjects.length > 0) {
    let acc = 0;
    for (const s of subjects) acc += s.mastery_level;
    mastery = Math.round(acc / subjects.length);
  }

  let weekCount = 0;
  for (const c of conversations) {
    const daysSince = (Date.now() - new Date(c.updated_at || c.created_at).getTime()) / 86400000;
    if (daysSince <= 7) weekCount++;
  }

  const resume = (sessionSlug: string) => {
    router.push(`/${sessionSlug}/dashboard`);
  };

  const delSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    const supabase = createClient();
    const { data: convs } = await supabase.from("conversations").select("id").eq("session_id", sessionId);
    if (convs) {
      for (const conv of convs) {
        await supabase.from("chat_messages").delete().eq("conversation_id", conv.id);
      }
    }
    await supabase.from("conversations").delete().eq("session_id", sessionId);
    await supabase.from("document_chunks").delete().eq("session_id", sessionId);
    await supabase.from("documents").delete().eq("session_id", sessionId);
    await supabase.from("kingdom_events").delete().eq("session_id", sessionId);
    await supabase.from("session_kingdom").delete().eq("session_id", sessionId);
    await supabase.from("session_quizzes").delete().eq("session_id", sessionId);
    await supabase.from("session_roadmap_modules").delete().eq("session_id", sessionId);
    await supabase.from("progress_tracking").delete().eq("session_id", sessionId);
    await supabase.from("sessions").delete().eq("id", sessionId);
    grab();
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#FDFBF7" }}>
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-[#3F5C3A]/40 border-t-[#3F5C3A] rounded-full animate-spin" />
          <span className="text-[#999] text-xs font-medium tracking-wide">Loading</span>
        </div>
      </div>
    );
  }

  const fname = user.user_metadata?.full_name?.split(" ")[0] || user.email?.split("@")[0] || "there";

  const stats = [
    { label: "Sessions", value: conversations.length, iconBg: STAT_COLORS[0].bg, iconColor: STAT_COLORS[0].icon, valueColor: STAT_COLORS[0].value, icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" },
    { label: "Mastery", value: `${mastery}%`, iconBg: STAT_COLORS[1].bg, iconColor: STAT_COLORS[1].icon, valueColor: STAT_COLORS[1].value, icon: "M12 4.5v15m7.5-7.5h-15" },
    { label: "Subjects", value: subjects.length, iconBg: STAT_COLORS[2].bg, iconColor: STAT_COLORS[2].icon, valueColor: STAT_COLORS[2].value, icon: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" },
    { label: "This week", value: weekCount, iconBg: STAT_COLORS[3].bg, iconColor: STAT_COLORS[3].icon, valueColor: STAT_COLORS[3].value, icon: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" },
  ];

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: "#FDFBF7" }}>
      <CreateSessionModal
        open={showModal}
        onClose={() => setShowModal(false)}
        subjects={subjects.map((s) => s.subject)}
      />

      <div className="mx-auto max-w-4xl px-6 py-10">
        <main className="relative z-10">
        <div className="pt-10 pb-2 flex items-start justify-between gap-4">
          <div>
            <h1 className="serif-display text-[28px] font-bold text-[#2D3436] tracking-tight leading-tight">
              {greeting},<br />
              <span style={{ color: "#3F5C3A" }}>{fname}</span>
            </h1>
            <p className="text-[15px] mt-1 opacity-80" style={{ color: "#666" }}>
              What are we diving into today?
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setShowModal(true)}
              className="btn-editorial h-11 px-5 rounded-full flex items-center gap-1.5 text-[15px] font-bold cursor-pointer"
            >
              <svg className="w-5 h-5 text-[#FDFBF7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              New
            </button>
            <div className="w-12 h-12 rounded-full border-2 border-white shadow-sm overflow-hidden">
              <div className="w-full h-full rounded-full flex items-center justify-center text-lg serif-display text-[#3F5C3A]" style={{ backgroundColor: "#F9F6F0" }}>
                {fname?.[0]?.toUpperCase()}
              </div>
            </div>
          </div>
        </div>
        <div className="pt-8 pb-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="flex flex-col gap-3 p-4 editorial"
                style={{ backgroundColor: "#FFFDF9" }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center editorial"
                  style={{ backgroundColor: stat.iconBg }}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={stat.iconColor} strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d={stat.icon} />
                  </svg>
                </div>
                <div>
                  <p className="text-[24px] font-bold leading-none" style={{ color: stat.valueColor }}>{stat.value}</p>
                  <p className="hint-label text-[11px] mt-1.5" style={{ color: "#555E61" }}>{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#3F5C3A" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                </svg>
                <h2 className="hint-label text-[17px] font-bold uppercase tracking-wide" style={{ color: "#2D3436" }}>Your Sessions</h2>
              </div>
              <button className="btn-editorial-ghost flex items-center gap-1.5 text-[13px] font-bold px-4 py-2 rounded-full cursor-pointer">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                View calendar
              </button>
            </div>
            <div className="flex gap-2 mb-6">
              {(["all", "active", "completed"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`h-9 px-6 rounded-full text-[14px] font-bold cursor-pointer ${filter === f ? "btn-editorial" : "btn-editorial-ghost"}`}
                >
                  {f === "all" ? "All" : f === "active" ? "Active" : "Done"}
                </button>
              ))}
            </div>
            {filtered.length === 0 ? (
              <div
                className="rounded-[32px] p-8 flex flex-col items-center text-center relative editorial"
                style={{ backgroundColor: "#fff" }}
              >
                <div className="mb-6 flex justify-center w-full relative">
                  <div
                    className="w-[150px] h-[150px] rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "#F9F6F0" }}
                  >
                    <span className="text-[64px] serif-display text-[#3F5C3A] leading-none select-none">Æ</span>
                  </div>
                  <svg className="absolute top-4 right-16 w-5 h-5 fill-[#FAD59B]" viewBox="0 0 24 24">
                    <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />
                  </svg>
                  <svg className="absolute top-10 left-16 w-3.5 h-3.5 fill-[#FAD59B]" viewBox="0 0 24 24">
                    <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />
                  </svg>
                  <svg className="absolute bottom-10 right-12 w-3.5 h-3.5 fill-[#FAD59B]" viewBox="0 0 24 24">
                    <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: "#2D3436" }}>No sessions yet</h3>
                <p className="text-[14px] leading-relaxed max-w-[260px] mb-8 opacity-80" style={{ color: "#666" }}>
                  Tap New to start your first learning session and I&apos;ll build a personalized path just for you.
                </p>
                <button
                  onClick={() => setShowModal(true)}
                  className="btn-editorial w-full h-[58px] rounded-full flex items-center justify-center gap-2 text-[16px] font-bold cursor-pointer"
                >
                  <svg className="w-5 h-5 text-[#FDFBF7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Create your first session
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((session) => (
                  <div
                    key={session.id}
                      onClick={() => session.slug && resume(session.slug)}
                    className="rounded-[24px] p-4 group cursor-pointer relative overflow-hidden transition-all editorial"
                    style={{ backgroundColor: "#fff" }}
                  >
                    <div
                      className="absolute inset-0 opacity-[0.03] pointer-events-none"
                      style={{ background: `radial-gradient(circle at 30% 30%, ${subjAccent(session.subject)}, transparent 70%)` }}
                    />
                    <button
                      onClick={(e) => delSession(session.id, e)}
                      className="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-400 transition-all cursor-pointer z-10"
                      style={{ backgroundColor: "rgba(0,0,0,0.03)" }}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="w-9 h-9 rounded-xl flex items-center justify-center serif-display text-sm font-bold text-[#FDFBF7]" style={{ backgroundColor: "#3F5C3A" }}>{subjInitial(session.subject)}</span>
                      <span
                        className="px-2.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider"
                        style={
                          session.progress >= 100
                            ? { backgroundColor: "rgba(63,92,58,0.1)", color: "#3F5C3A" }
                            : { backgroundColor: "rgba(45,52,54,0.06)", color: "#2D3436" }
                        }
                      >
                        {session.progress >= 100 ? "Done" : "Active"}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold mb-1 leading-tight" style={{ color: "#2D3436" }}>{session.title}</h3>
                    <p className="text-[11px] mb-3" style={{ color: "#999" }}>{timeAgo(session.updated_at || session.created_at)}</p>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-medium uppercase tracking-wider" style={{ color: "#bbb" }}>
                        <span>Progress</span>
                        <span className="font-bold" style={{ color: "#999" }}>{session.progress}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#F3EDE3" }}>
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${session.progress}%`, backgroundColor: subjAccent(session.subject) }}
                        />
                      </div>
                    </div>
                    <div className="pt-3 mt-3 flex items-center justify-between" style={{ borderTop: "1px solid #F3EDE3" }}>
                      <span className="text-[9px] font-bold uppercase tracking-widest group-hover:opacity-100 transition-opacity" style={{ color: "#3F5C3A", opacity: 0.5 }}>
                        Resume →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      </div>
    </div>
  );
}