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

function ZapIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

function TargetIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.75l-9 9-9-9 9-9 9 9z" />
    </svg>
  );
}

function BookOpenIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path d="M12 6.257v10.227m-3-3.013l3 3.013 3-3.013" />
    </svg>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path d="M12 3l1.9 5.9h5.9l-4.7 3.6 1.8 5.9-4.9-3.3-4.9 3.3 1.8-5.9-4.7-3.6h5.9z" />
    </svg>
  );
}

function FlameIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path d="M12 2C8 6 6 9 6 12a6 6 0 0012 0c0-3-2-6-6-10z" />
    </svg>
  );
}

function MoreVerticalIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v.01M12 10v.01M12 15v.01M12 20v.01" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
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
    if (sessionsRes.data) {
      setConversations(sessionsRes.data as Conversation[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/");
    }
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
      ? Math.round(
          subjects.reduce((acc, s) => acc + s.mastery_level, 0) / subjects.length
        )
      : 0;

  const handleResume = (sessionSlug: string) => {
    router.push(`/${sessionSlug}/chat`);
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    const supabase = createClient();
    await supabase.from("sessions").delete().eq("id", sessionId);
    fetchHubData();
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-deep-onyx flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-cyber-yellow border-t-transparent rounded-full animate-spin" />
          <span className="text-white/40 text-sm font-bold uppercase tracking-widest">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#0A0A0A] flex flex-col overflow-hidden">

      {/* Fixed Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 h-20 px-8 flex items-center justify-between z-50 bg-white/5 border-b border-white/5 header-blur">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#FDE047] rounded-xl flex items-center justify-center">
            <ZapIcon className="text-black text-xl" />
          </div>
          <span className="text-2xl font-black tracking-tighter uppercase text-white">Aether</span>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
            <input
              type="text"
              placeholder="Search sessions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm text-white placeholder-white/40 focus:outline-none focus:border-cyber-yellow/50 w-48"
            />
          </div>

          <div className="hidden md:flex items-center gap-2">
            {(["all", "active", "completed"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-5 py-2 rounded-full text-xs font-bold premium-transition ${
                  filter === f
                    ? "bg-white/10 text-white"
                    : "text-white/40 hover:text-white"
                }`}
              >
                {f === "all" ? "All" : f === "active" ? "In Progress" : "Completed"}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="bg-[#FDE047] text-black font-black py-2.5 px-6 rounded-full text-xs uppercase tracking-widest hover:scale-105 active:scale-95 premium-transition shadow-[0_0_20px_rgba(253,224,71,0.2)]"
          >
            Create New Session
          </button>
        </div>
      </nav>

      {/* Page Content Container */}
      <main className="flex-1 mt-20 overflow-y-auto">

        {/* Hero Section */}
        <section className="h-[35vh] liquid-wave flex flex-col items-center justify-center text-center px-6 relative overflow-hidden">
          <div className="absolute top-[-50px] left-[-50px] w-64 h-64 bg-black/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-30px] right-[10%] w-48 h-48 bg-black/5 rounded-full blur-2xl"></div>

          <div className="relative z-10">
            <h1 className="text-6xl md:text-7xl font-black tracking-tighter text-black mb-4">Your Learning Hub</h1>
            <p className="text-xl font-medium text-black/60 mb-8">All your sessions in one place.</p>

            <div className="flex items-center justify-center gap-4">
              <div className="bg-black text-white px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest">
                {conversations.length} Active Sessions
              </div>
              <div className="bg-black/10 border border-black/10 backdrop-blur-md px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest">
                {totalMastery}% Avg. Mastery
              </div>
            </div>
          </div>
        </section>

        {/* Featured Carousel */}
        <section className="-mt-12 px-8">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-4 pl-2">Featured Sessions</h3>
          <div className="flex overflow-x-auto gap-8 no-scrollbar scroll-smooth pb-10 px-2" style={{ scrollSnapType: "x mandatory" }}>
            {featuredSessions.length === 0 ? (
              <div
                onClick={() => setShowModal(true)}
                className="carousel-item w-full h-[320px] glass-card rounded-[32px] overflow-hidden relative flex items-center justify-center cursor-pointer hover:scale-[1.02] premium-transition border-dashed border-2 border-white/10"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#FDE047]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <PlusIcon className="text-4xl text-[#FDE047]" />
                  </div>
                  <p className="text-white/60 text-sm font-bold">Create your first session to get started</p>
                </div>
              </div>
            ) : (
              featuredSessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => session.slug && handleResume(session.slug)}
                  className="carousel-item w-[600px] h-[320px] glass-card rounded-[32px] overflow-hidden relative group hover:scale-[1.02] premium-transition cursor-pointer"
                >
                  <div
                    className="absolute inset-0 bg-gradient-to-br to-transparent z-0"
                    style={{ backgroundImage: `linear-gradient(135deg, ${extractSubjectColor(session.subject)}33, transparent)` }}
                  />
                  <div className="absolute top-6 left-6 z-10 flex items-center gap-2">
                    <span className="text-2xl">{getSubjectEmoji(session.subject)}</span>
                    <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black text-white uppercase tracking-widest border border-white/10">
                      {session.subject}
                    </span>
                  </div>
                  <div className="absolute bottom-6 left-8 right-8 z-10">
                    <h2 className="text-3xl font-black mb-2">{session.title}</h2>
                    <p className="text-white/60 text-sm mb-6">Last studied {timeAgo(session.updated_at || session.created_at)}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                        Last Accessed: {timeAgo(session.updated_at || session.created_at)}
                      </span>
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5 text-[10px] font-bold">
                          <ClockIcon className="w-3 h-3" /> {timeAgo(session.created_at)}
                        </span>
                        <span
                          className="flex items-center gap-1.5 text-[10px] font-bold"
                          style={{ color: extractSubjectColor(session.subject) }}
                        >
                          <TargetIcon className="w-3 h-3" /> {session.progress}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Recent Sessions Grid */}
        <section className="px-10 py-16">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-6 pl-2">All Sessions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

            {/* Quick Create Card */}
            <div
              onClick={() => setShowModal(true)}
              className="glass-card rounded-[32px] p-8 flex flex-col items-center justify-center text-center group hover:scale-110 premium-transition border-dashed border-2 border-white/10 cursor-pointer"
            >
              <div className="w-16 h-16 bg-[#FDE047]/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-[#FDE047] premium-transition">
                <PlusIcon className="text-4xl text-[#FDE047] group-hover:text-black" />
              </div>
              <h3 className="text-xl font-black text-white">Create New Session</h3>
              <p className="text-xs text-white/30 mt-2 uppercase tracking-widest">Launch your next tutor</p>
            </div>

            {recentSessions.length === 0 ? (
              <div className="glass-card rounded-[32px] p-8 flex flex-col items-center justify-center text-center col-span-3">
                <p className="text-white/30 text-sm">
                  {filter === "all"
                    ? "No sessions yet. Create your first session to get started!"
                    : `No ${filter} sessions found.`}
                </p>
              </div>
            ) : (
              recentSessions.map((session) => (
                <div key={session.id} onClick={() => session.slug && handleResume(session.slug)} className="glass-card rounded-[32px] p-6 group hover:scale-105 premium-transition relative cursor-pointer">
                  <button
                    onClick={(e) => handleDeleteSession(session.id, e)}
                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-red-500/20 hover:text-red-400 transition-all cursor-pointer z-10"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>

                  <div className="flex justify-between items-start mb-6">
                    <span className="text-3xl">{getSubjectEmoji(session.subject)}</span>
                    <span
                      className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        session.progress >= 100
                          ? "bg-[#10B981]/10 text-[#10B981]"
                          : "bg-white/5 text-white/50"
                      }`}
                    >
                      {session.progress >= 100 ? "Finished" : "Active"}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">{session.title}</h3>
                  <p className="text-sm text-white/40 mb-6 truncate">Last studied {timeAgo(session.updated_at || session.created_at)}</p>
                  <div className="space-y-3 mb-8 text-[10px] font-bold text-white/30 uppercase tracking-widest">
                    <div className="flex justify-between">
                      <span>Progress</span>
                      <span className="text-white/60">{session.progress}%</span>
                    </div>
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${session.progress}%`,
                          backgroundColor: extractSubjectColor(session.subject),
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <button
                      onClick={() => session.slug && handleResume(session.slug)}
                      className="bg-[#FDE047] text-black px-6 py-2 rounded-full text-[10px] font-black uppercase shadow-lg hover:scale-105 active:scale-95 premium-transition"
                    >
                      Resume
                    </button>
                    <MoreVerticalIcon className="text-white/20 cursor-pointer hover:text-white" />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Stats Section */}
        <section className="px-10 pb-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="glass-card rounded-[32px] p-8 text-center">
              <BookOpenIcon className="text-3xl text-[#FDE047] mb-3 mx-auto" />
              <p className="text-4xl font-black">{conversations.length}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mt-1">Sessions Created</p>
            </div>
            <div className="glass-card rounded-[32px] p-8 text-center">
              <ClockIcon className="text-3xl text-blue-400 mb-3 mx-auto" />
              <p className="text-4xl font-black">{subjects.length}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mt-1">Subjects</p>
            </div>
            <div className="glass-card rounded-[32px] p-8 text-center">
              <SparklesIcon className="text-3xl text-purple-400 mb-3 mx-auto" />
              <p className="text-4xl font-black">{totalMastery}%</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mt-1">Avg. Mastery</p>
            </div>
            <div className="glass-card rounded-[32px] p-8 text-center">
              <FlameIcon className="text-3xl text-orange-500 mb-3 mx-auto" />
              <p className="text-4xl font-black">{conversations.filter((c) => {
                const daysSince = (Date.now() - new Date(c.updated_at || c.created_at).getTime()) / 86400000;
                return daysSince <= 7;
              }).length}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mt-1">Sessions This Week</p>
            </div>
          </div>
        </section>

        {/* Footer Ticker */}
        <div className="p-12 border-t border-white/5 bg-black">
          <div className="flex items-center justify-between opacity-30 grayscale">
            <span className="text-[10px] font-bold tracking-widest uppercase">Powering the future of learning</span>
            <div className="flex gap-12">
              <span className="font-bold tracking-tighter">OpenAI</span>
              <span className="font-bold tracking-tighter">Notion</span>
              <span className="font-bold tracking-tighter">Figma</span>
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
