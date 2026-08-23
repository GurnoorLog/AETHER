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

const SUBJECT_EMOJI: Record<string, string> = {
  Mathematics: "\uD83D\uDCD0",
  "Computer Science": "\uD83D\uDCBB",
  Biology: "\uD83E\uDDEA",
  Physics: "\u269B\uFE0F",
  Medicine: "\uD83D\uDC8A",
  Engineering: "\uD83D\uDD27",
  Languages: "\uD83C\uDF0D",
  History: "\uD83D\uDCDC",
  Psychology: "\uD83E\uDDE0",
  Economics: "\uD83D\uDCB0",
};

function getSubjectFromTitle(title: string): string {
  const match = title.match(/^(.+?) Study Session$/);
  return match ? match[1] : title;
}

function getSubjectEmoji(subject: string): string {
  return SUBJECT_EMOJI[subject] || "\uD83D\uDCDA";
}

function getSubjectProgress(subject: string, subjects: Subject[]): number {
  const found = subjects.find((s) => s.subject === subject);
  return found ? found.mastery_level : 0;
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

function extractSubjectColor(subject: string): string {
  const colors: Record<string, string> = {
    Mathematics: "#FDE047",
    "Computer Science": "#60A5FA",
    Biology: "#34D399",
    Physics: "#A78BFA",
    Medicine: "#FB7185",
    Engineering: "#FBBF24",
    Languages: "#22D3EE",
    History: "#F59E0B",
    Psychology: "#EC4899",
    Economics: "#10B981",
  };
  return colors[subject] || "#FDE047";
}

const STAT_COLORS = [
  { bg: "#F0EEFA", icon: "#7C69A2", value: "#7C69A2" },
  { bg: "#FFF5E6", icon: "#EAB308", value: "#EAB308" },
  { bg: "#EBF1FF", icon: "#6366F1", value: "#6366F1" },
  { bg: "#EBF7F2", icon: "#6B8E61", value: "#6B8E61" },
];

function getGreeting(): string {
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

  const fetchHubData = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    const [subjectsRes, sessionsRes] = await Promise.all([
      supabase.from("progress_tracking").select("subject, mastery_level").eq("user_id", user.id),
      supabase
        .from("sessions")
        .select("id, title, slug, subject, created_at, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false }),
    ]);
    if (subjectsRes.data) setSubjects(subjectsRes.data as Subject[]);
    if (sessionsRes.data) setConversations(sessionsRes.data as Conversation[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/");
  }, [user, authLoading, router]);

  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

  useEffect(() => {
    if (user) fetchHubData();
  }, [user, fetchHubData]);

  const sessionsWithSubject = conversations.map((conv) => ({
    ...conv,
    subject: getSubjectFromTitle(conv.title),
    progress: getSubjectProgress(getSubjectFromTitle(conv.title), subjects),
  }));

  const filteredSessions = sessionsWithSubject.filter((s) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "active" && s.progress < 100) ||
      (filter === "completed" && s.progress >= 100);
    return matchesFilter;
  });

  const totalMastery =
    subjects.length > 0
      ? Math.round(subjects.reduce((acc, s) => acc + s.mastery_level, 0) / subjects.length)
      : 0;

  const thisWeekCount = conversations.filter((c) => {
    const daysSince = (Date.now() - new Date(c.updated_at || c.created_at).getTime()) / 86400000;
    return daysSince <= 7;
  }).length;

  const handleResume = (sessionSlug: string) => {
    router.push(`/${sessionSlug}/dashboard`);
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
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
    fetchHubData();
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#FDFBF7" }}>
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-[#6B8E61]/40 border-t-[#6B8E61] rounded-full animate-spin" />
          <span className="text-[#999] text-xs font-medium tracking-wide">Loading</span>
        </div>
      </div>
    );
  }

  const firstName = user.user_metadata?.full_name?.split(" ")[0] || user.email?.split("@")[0] || "there";

  const stats = [
    { label: "Sessions", value: conversations.length, iconBg: STAT_COLORS[0].bg, iconColor: STAT_COLORS[0].icon, valueColor: STAT_COLORS[0].value, icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" },
    { label: "Mastery", value: `${totalMastery}%`, iconBg: STAT_COLORS[1].bg, iconColor: STAT_COLORS[1].icon, valueColor: STAT_COLORS[1].value, icon: "M12 4.5v15m7.5-7.5h-15" },
    { label: "Subjects", value: subjects.length, iconBg: STAT_COLORS[2].bg, iconColor: STAT_COLORS[2].icon, valueColor: STAT_COLORS[2].value, icon: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" },
    { label: "This week", value: thisWeekCount, iconBg: STAT_COLORS[3].bg, iconColor: STAT_COLORS[3].icon, valueColor: STAT_COLORS[3].value, icon: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" },
  ];

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: "#FDFBF7" }}>
      <CreateSessionModal
        open={showModal}
        onClose={() => setShowModal(false)}
        subjects={subjects.map((s) => s.subject)}
      />

      <div className="mx-auto max-w-7xl px-6 py-10 flex flex-col lg:flex-row gap-10">
        {/* Left content */}
        <main className="flex-1 min-w-0 relative z-10">

        {/* Header */}
        <div className="pt-10 pb-2 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-bold text-[#333] tracking-tight leading-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {greeting},<br />
              <span style={{ color: "#6B8E61" }}>{firstName} 👋</span>
            </h1>
            <p className="text-[15px] mt-1 opacity-80" style={{ color: "#666" }}>
              Ready to learn something amazing today?
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {/* New button */}
            <button
              onClick={() => setShowModal(true)}
              className="h-11 px-5 rounded-full flex items-center gap-1.5 shadow-lg text-white font-bold text-[15px] cursor-pointer"
              style={{ backgroundColor: "#6B8E61", boxShadow: "0 8px 20px rgba(107,142,97,0.25)", transition: "transform 0.2s" }}
              onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.96)")}
              onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              New
            </button>
            {/* Avatar */}
            <div className="w-12 h-12 rounded-full border-2 border-white shadow-sm overflow-hidden">
              <div className="w-full h-full rounded-full flex items-center justify-center text-lg" style={{ backgroundColor: "#F9F6F0" }}>
                🐨
              </div>
            </div>
          </div>
        </div>

        {/* Content column */}
        <div className="pt-8 pb-12">
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="flex flex-col gap-3 p-4 rounded-[20px]"
                style={{ backgroundColor: "#fff", border: "1px solid #F3EDE3", boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: stat.iconBg }}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={stat.iconColor} strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d={stat.icon} />
                  </svg>
                </div>
                <div>
                  <p className="text-[24px] font-bold leading-none" style={{ color: stat.valueColor }}>{stat.value}</p>
                  <p className="text-[11px] font-medium mt-1.5" style={{ color: "#999" }}>{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Your Sessions */}
          <div className="mt-10">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#6B8E61" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                </svg>
                <h2 className="text-[18px] font-bold" style={{ color: "#333" }}>Your Sessions</h2>
              </div>
              <button className="flex items-center gap-1.5 text-[13px] font-bold" style={{ color: "#6B8E61" }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                View calendar
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              {(["all", "active", "completed"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className="h-9 px-6 rounded-[18px] text-[14px] font-bold transition-colors"
                  style={
                    filter === f
                      ? { backgroundColor: "#F3EDE3", color: "#6B8E61" }
                      : { color: "#999" }
                  }
                >
                  {f === "all" ? "All" : f === "active" ? "Active" : "Done"}
                </button>
              ))}
            </div>

            {/* Sessions list or empty state */}
            {filteredSessions.length === 0 ? (
              <div
                className="rounded-[32px] p-8 flex flex-col items-center text-center relative"
                style={{ backgroundColor: "#fff", border: "1px solid #F3EDE3" }}
              >
                {/* Empty state illustration */}
                <div className="mb-6 flex justify-center w-full relative">
                  <div
                    className="w-[150px] h-[150px] rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "#F9F6F0" }}
                  >
                    <span className="text-[60px]">🐨</span>
                  </div>
                  {/* Sparkles */}
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
                <h3 className="text-lg font-bold mb-2" style={{ color: "#333" }}>No sessions yet</h3>
                <p className="text-[14px] leading-relaxed max-w-[260px] mb-8 opacity-80" style={{ color: "#666" }}>
                  Tap New to start your first learning session and I&apos;ll build a personalized path just for you.
                </p>
                <button
                  onClick={() => setShowModal(true)}
                  className="w-full h-[58px] rounded-[29px] flex items-center justify-center gap-2 text-white font-bold text-[16px] shadow-lg"
                  style={{ backgroundColor: "#6B8E61", boxShadow: "0 8px 20px rgba(107,142,97,0.2)" }}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Create your first session
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => session.slug && handleResume(session.slug)}
                    className="rounded-[24px] p-4 group cursor-pointer relative overflow-hidden transition-all"
                    style={{ backgroundColor: "#fff", border: "1px solid #F3EDE3" }}
                  >
                    <div
                      className="absolute inset-0 opacity-[0.03] pointer-events-none"
                      style={{ background: `radial-gradient(circle at 30% 30%, ${extractSubjectColor(session.subject)}, transparent 70%)` }}
                    />
                    <button
                      onClick={(e) => handleDeleteSession(session.id, e)}
                      className="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-400 transition-all cursor-pointer z-10"
                      style={{ backgroundColor: "rgba(0,0,0,0.03)" }}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{getSubjectEmoji(session.subject)}</span>
                      <span
                        className="px-2.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider"
                        style={
                          session.progress >= 100
                            ? { backgroundColor: "rgba(34,197,94,0.1)", color: "#22c55e" }
                            : { backgroundColor: "rgba(0,0,0,0.04)", color: "#999" }
                        }
                      >
                        {session.progress >= 100 ? "Done" : "Active"}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold mb-1 leading-tight" style={{ color: "#333" }}>{session.title}</h3>
                    <p className="text-[11px] mb-3" style={{ color: "#999" }}>{timeAgo(session.updated_at || session.created_at)}</p>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-medium uppercase tracking-wider" style={{ color: "#bbb" }}>
                        <span>Progress</span>
                        <span className="font-bold" style={{ color: "#999" }}>{session.progress}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#F3EDE3" }}>
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${session.progress}%`, backgroundColor: extractSubjectColor(session.subject) }}
                        />
                      </div>
                    </div>
                    <div className="pt-3 mt-3 flex items-center justify-between" style={{ borderTop: "1px solid #F3EDE3" }}>
                      <span className="text-[9px] font-bold uppercase tracking-widest group-hover:opacity-100 transition-opacity" style={{ color: "#6B8E61", opacity: 0.5 }}>
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

      {/* Right: hero image panel */}
      <aside className="hidden lg:block w-[360px] xl:w-[420px] shrink-0">
        <div
          className="sticky top-10 rounded-[36px] overflow-hidden h-[600px] relative"
          style={{ boxShadow: "0 30px 60px -20px rgba(0,0,0,0.25)" }}
        >
          <img src="/design/hub-hero.jpeg" alt="" className="w-full h-full object-cover" />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to top, rgba(45,52,54,0.45), rgba(45,52,54,0) 50%)" }}
          />
          <div className="absolute bottom-6 left-6 right-6 text-white">
            <p className="text-[15px] font-semibold leading-snug drop-shadow-sm">Your cozy corner to learn 🐨</p>
            <p className="text-[13px] opacity-90 mt-1 drop-shadow-sm">Pick up where you left off, or start something new.</p>
          </div>
        </div>
      </aside>
      </div>
    </div>
  );
}
