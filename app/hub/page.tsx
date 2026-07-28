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

function Icon({ d, className }: { d: string; className?: string }) {
  return (
    <svg className={className || "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

export default function HubPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [searchQuery, setSearchQuery] = useState("");

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
    const matchesSearch =
      !searchQuery ||
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const featuredSessions = filteredSessions.slice(0, 3);
  const recentSessions = filteredSessions.slice(3, 10);

  const totalMastery =
    subjects.length > 0
      ? Math.round(subjects.reduce((acc, s) => acc + s.mastery_level, 0) / subjects.length)
      : 0;

  const handleResume = (sessionSlug: string) => {
    router.push(`/${sessionSlug}/dashboard`);
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    const supabase = createClient();
    // Cascade-delete all session-related data
    const { data: convs } = await supabase.from("conversations").select("id").eq("session_id", sessionId);
    if (convs) {
      for (const conv of convs) {
        await supabase.from("chat_messages").delete().eq("conversation_id", conv.id);
      }
    }
    await supabase.from("conversations").delete().eq("session_id", sessionId);
    await supabase.from("session_roadmap_modules").delete().eq("session_id", sessionId);
    await supabase.from("progress_tracking").delete().eq("session_id", sessionId);
    await supabase.from("session_quizzes").delete().eq("session_id", sessionId);
    await supabase.from("document_chunks").delete().eq("session_id", sessionId);
    await supabase.from("documents").delete().eq("session_id", sessionId);
    await supabase.from("kingdom_events").delete().eq("session_id", sessionId);
    await supabase.from("session_kingdom").delete().eq("session_id", sessionId);
    await supabase.from("sessions").delete().eq("id", sessionId);
    fetchHubData();
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-deep-onyx flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-cyber-yellow/40 border-t-cyber-yellow rounded-full animate-spin" />
          <span className="text-white/30 text-xs font-medium tracking-wide">Loading</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-deep-onyx flex flex-col overflow-hidden">

      {/* Top Nav */}
      <nav className="fixed top-0 left-0 right-0 h-16 px-8 flex items-center justify-between z-50 glass border-b border-white/[0.04]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-cyber-yellow rounded-[10px] flex items-center justify-center">
            <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </div>
          <span className="text-[15px] font-bold tracking-[-0.03em] text-white/90">Aether</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/[0.03] border border-white/[0.06] rounded-full py-2 pl-10 pr-4 text-xs text-white placeholder-white/25 focus:outline-none focus:border-white/[0.12] w-44 transition-colors"
            />
          </div>

          <div className="hidden md:flex items-center gap-1 bg-white/[0.02] rounded-full p-1">
            {(["all", "active", "completed"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full text-[11px] font-medium transition-all duration-300 ${
                  filter === f
                    ? "bg-white/[0.08] text-white"
                    : "text-white/30 hover:text-white/60"
                }`}
              >
                {f === "all" ? "All" : f === "active" ? "In Progress" : "Done"}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="btn-primary py-2 px-5 text-[11px] font-bold uppercase tracking-wider"
          >
            New Session
          </button>
        </div>
      </nav>

      {/* Page Content */}
      <main className="flex-1 mt-16 overflow-y-auto">

        {/* Hero */}
        <section className="relative min-h-[34vh] liquid-wave flex flex-col items-center justify-center text-center px-6">
          {/* Subtle dot pattern */}
          <div className="absolute inset-0 noise-texture" />
          <div className="absolute top-[-80px] left-[-80px] w-72 h-72 bg-black/[0.03] rounded-full blur-3xl" />
          <div className="absolute bottom-[-40px] right-[8%] w-56 h-56 bg-black/[0.03] rounded-full blur-2xl" />

          <div className="relative z-10">
            <h1 className="heading-display text-black mb-3">Your Learning Hub</h1>
            <p className="text-base font-medium text-black/50 mb-8 max-w-md mx-auto">All your sessions, organized and ready.</p>

            <div className="flex items-center justify-center gap-3">
              <div className="bg-black text-white px-4 py-1.5 rounded-full text-[10px] font-semibold tracking-wide">
                {conversations.length} Active Sessions
              </div>
              <div className="bg-black/5 border border-black/10 backdrop-blur-sm px-4 py-1.5 rounded-full text-[10px] font-semibold tracking-wide text-black/70">
                {totalMastery}% Mastery
              </div>
            </div>
          </div>
        </section>

        {/* Featured Carousel */}
        <section className="-mt-10 px-8 relative z-20">
          <p className="label-micro text-white/25 mb-4 pl-1">Featured</p>
          <div className="flex overflow-x-auto gap-6 no-scrollbar scroll-smooth pb-8 px-1" style={{ scrollSnapType: "x mandatory" }}>
            {featuredSessions.length === 0 ? (
              <div
                onClick={() => setShowModal(true)}
                className="carousel-item w-full h-[280px] glass-card rounded-[28px] overflow-hidden flex items-center justify-center cursor-pointer hover:bg-white/[0.06] border-dashed border-white/[0.08]"
              >
                <div className="text-center">
                  <div className="w-14 h-14 bg-cyber-yellow/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-cyber-yellow/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </div>
                  <p className="text-white/40 text-sm font-medium">Create your first session</p>
                </div>
              </div>
            ) : (
              featuredSessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => session.slug && handleResume(session.slug)}
                  className="carousel-item w-[520px] h-[280px] glass-card rounded-[28px] overflow-hidden relative group cursor-pointer"
                >
                  <div
                    className="absolute inset-0 opacity-[0.04]"
                    style={{ background: `radial-gradient(circle at 30% 30%, ${extractSubjectColor(session.subject)}, transparent 70%)` }}
                  />
                  <div className="absolute top-5 left-5 z-10 flex items-center gap-2">
                    <span className="text-xl">{getSubjectEmoji(session.subject)}</span>
                    <span className="px-2.5 py-1 bg-white/[0.06] backdrop-blur-sm rounded-full text-[9px] font-semibold text-white/70 uppercase tracking-wider border border-white/[0.06]">
                      {session.subject}
                    </span>
                  </div>
                  <div className="absolute bottom-5 left-6 right-6 z-10">
                    <h2 className="text-2xl font-bold tracking-tight mb-1.5">{session.title}</h2>
                    <p className="text-white/40 text-xs mb-5">{timeAgo(session.updated_at || session.created_at)}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-[9px] font-medium text-white/30 uppercase tracking-wider">
                          {session.progress}%
                        </span>
                        <div className="w-24 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${session.progress}%`,
                              backgroundColor: extractSubjectColor(session.subject),
                            }}
                          />
                        </div>
                      </div>
                      <span className="text-[10px] font-medium text-white/40">Resume</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* All Sessions Grid */}
        <section className="px-8 py-12">
          <p className="label-micro text-white/25 mb-6 pl-1">All Sessions</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 stagger-children">

            {/* Create Card */}
            <div
              onClick={() => setShowModal(true)}
              className="glass-card rounded-[24px] p-7 flex flex-col items-center justify-center text-center group cursor-pointer border-dashed border-white/[0.06] hover:border-white/[0.12]"
            >
              <div className="w-12 h-12 bg-cyber-yellow/10 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-cyber-yellow/15 transition-colors">
                <svg className="w-5 h-5 text-cyber-yellow/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold mb-1">New Session</h3>
              <p className="text-[10px] text-white/25 uppercase tracking-wider">Start learning</p>
            </div>

            {recentSessions.length === 0 && filter === "all" ? (
              <>
                <div className="glass-card rounded-[24px] p-6 animate-float relative" style={{ animationDelay: "-1s" }}>
                  <div className="flex justify-between items-start mb-5">
                    <span className="text-2xl">🧠</span>
                    <span className="px-2 py-0.5 bg-white/[0.04] rounded-full text-[8px] font-semibold uppercase tracking-wider text-white/30">Soon</span>
                  </div>
                  <h3 className="text-sm font-semibold mb-1">AI / Machine Learning</h3>
                  <p className="text-xs text-white/30 mb-5">Neural networks and deep learning.</p>
                  <div className="pt-3 border-t border-white/[0.04]">
                    <span className="text-[9px] text-white/20 uppercase tracking-wider">Coming Soon</span>
                  </div>
                </div>

                <div className="glass-card rounded-[24px] p-6 animate-float relative" style={{ animationDelay: "-2s" }}>
                  <div className="flex justify-between items-start mb-5">
                    <span className="text-2xl">📝</span>
                    <span className="px-2 py-0.5 bg-white/[0.04] rounded-full text-[8px] font-semibold uppercase tracking-wider text-white/30">Soon</span>
                  </div>
                  <h3 className="text-sm font-semibold mb-1">SAT Prep</h3>
                  <p className="text-xs text-white/30 mb-5">Practice tests and strategies.</p>
                  <div className="pt-3 border-t border-white/[0.04]">
                    <span className="text-[9px] text-white/20 uppercase tracking-wider">Coming Soon</span>
                  </div>
                </div>
              </>
            ) : recentSessions.length === 0 ? (
              <div className="glass-card rounded-[24px] p-8 flex flex-col items-center justify-center text-center col-span-3">
                <p className="text-white/25 text-sm">
                  {filter === "all" ? "No sessions yet." : `No ${filter} sessions.`}
                </p>
              </div>
            ) : (
              recentSessions.map((session, idx) => (
                <div key={session.id} onClick={() => session.slug && handleResume(session.slug)} className="glass-card rounded-[24px] p-6 group cursor-pointer relative">
                  <button
                    onClick={(e) => handleDeleteSession(session.id, e)}
                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center hover:bg-red-500/10 hover:text-red-400 transition-all cursor-pointer z-10"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>

                  <div className="flex justify-between items-start mb-5">
                    <span className="text-2xl">{getSubjectEmoji(session.subject)}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-semibold uppercase tracking-wider ${
                      session.progress >= 100
                        ? "bg-green-500/10 text-green-400"
                        : "bg-white/[0.04] text-white/30"
                    }`}>
                      {session.progress >= 100 ? "Done" : "Active"}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold mb-1">{session.title}</h3>
                  <p className="text-xs text-white/30 mb-5">{timeAgo(session.updated_at || session.created_at)}</p>
                  <div className="space-y-2 mb-5">
                    <div className="flex justify-between text-[9px] font-medium text-white/25 uppercase tracking-wider">
                      <span>Progress</span>
                      <span className="text-white/40">{session.progress}%</span>
                    </div>
                    <div className="w-full h-1 bg-white/[0.04] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${session.progress}%`,
                          backgroundColor: extractSubjectColor(session.subject),
                        }}
                      />
                    </div>
                  </div>
                  <div className="pt-3 border-t border-white/[0.04] flex items-center justify-between">
                    <button
                      onClick={(e) => { e.stopPropagation(); session.slug && handleResume(session.slug); }}
                      className="bg-cyber-yellow text-black px-5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider hover:scale-105 active:scale-95 transition-all"
                    >
                      Resume
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Stats */}
        <section className="px-8 pb-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25", value: conversations.length, label: "Sessions" },
              { icon: "M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342", value: subjects.length, label: "Subjects" },
              { icon: "M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5", value: `${totalMastery}%`, label: "Mastery" },
              { icon: "M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z", value: conversations.filter((c) => {
                const daysSince = (Date.now() - new Date(c.updated_at || c.created_at).getTime()) / 86400000;
                return daysSince <= 7;
              }).length, label: "This Week" },
            ].map((stat, i) => (
              <div key={i} className="glass-card rounded-[20px] p-6 text-center">
                <Icon d={stat.icon} className="w-5 h-5 text-white/20 mx-auto mb-3" />
                <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                <p className="label-micro text-white/20 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <div className="px-8 py-8 border-t border-white/[0.04]">
          <div className="flex items-center justify-between opacity-20">
            <span className="text-[9px] font-medium tracking-wider uppercase text-white/50">Powering the future of learning</span>
            <div className="flex gap-8">
              {["OpenAI", "Notion", "Figma"].map((name) => (
                <span key={name} className="text-[10px] font-semibold tracking-tight text-white/40">{name}</span>
              ))}
            </div>
          </div>
        </div>
      </main>

      <CreateSessionModal
        open={showModal}
        onClose={() => setShowModal(false)}
        subjects={subjects.map((s) => s.subject)}
      />
    </div>
  );
}
