"use client";

import { useEffect, useState, useRef, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { useSession } from "../layout";
import { createClient } from "@/lib/supabase/client";
import { useVoiceTutor } from "@/hooks/useVoiceTutor";


function fmtDur(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  source?: "voice" | "chat";
}

const WAVE_BARS = [
  { h: "40%", delay: "-0.2s" },
  { h: "70%", delay: "-0.5s" },
  { h: "35%", delay: "-0.8s" },
  { h: "85%", delay: "-0.1s" },
  { h: "60%", delay: "-0.4s" },
  { h: "95%", delay: "-0.7s" },
  { h: "50%", delay: "-0.3s" },
  { h: "80%", delay: "-0.6s" },
  { h: "45%", delay: "-0.9s" },
  { h: "75%", delay: "-0.2s" },
  { h: "55%", delay: "-0.5s" },
  { h: "90%", delay: "-0.8s" },
  { h: "40%", delay: "-1.1s" },
];

export default function VoiceTutorPage({ params }: { params: Promise<{ session: string }> }) {
  const startedRef = useRef(false);
  const resolvedParams = use(params);
  const slug = resolvedParams.session;
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { session } = useSession();

  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [volume, setVolume] = useState(65);

  const STORAGE_KEY = `aether_active_conversation_${slug}`;
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [dbMessages, setDbMessages] = useState<ChatMsg[]>([]);
  const savedIdsRef = useRef<Set<string>>(new Set());
  const prevConvLenRef = useRef(0);

  const voice = useVoiceTutor({ sessionId: session?.id || slug });

  const makeConv = useCallback(async () => {
    if (!user || !session) return null;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("conversations")
      .insert({ user_id: user.id, session_id: session.id, title: session.title || "Voice Session" })
      .select("id")
      .single();
    if (data && !error) {
      localStorage.setItem(STORAGE_KEY, data.id);
      setActiveConversation(data.id);
      return data.id;
    }
    return null;
  }, [user, session, STORAGE_KEY]);

  const { state, conversation, micActive, outputMuted, start, stop, setMicMuted, setOutputMuted } = voice;

  const [localStorageReady, setLocalStorageReady] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setActiveConversation(saved);
    setLocalStorageReady(true);
  }, [STORAGE_KEY]);

  useEffect(() => {
    if (startedRef.current || authLoading || !user || !session || !localStorageReady) return;
    const doStart = async () => {
      startedRef.current = true;
      let convId = activeConversation;
      if (!convId) {
        convId = await makeConv();
      }
      if (convId && state === "idle") {
        start(convId);
      }
    };
    if (activeConversation || state === "idle") {
      doStart();
    }
  }, [localStorageReady, activeConversation, authLoading, user, session, state, start, makeConv]);

  const loadMsgs = useCallback(async (convId: string) => {
    if (!convId) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("chat_messages")
      .select("id, role, content, created_at")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });
    if (data) {
      setDbMessages(data as ChatMsg[]);
      savedIdsRef.current = new Set(data.map((m) => m.id));
    }
  }, []);

  useEffect(() => {
    if (activeConversation) loadMsgs(activeConversation);
  }, [activeConversation, loadMsgs]);

  useEffect(() => {
    if (!activeConversation || !user || conversation.length === 0) return;

    const prevN = prevConvLenRef.current;
    if (conversation.length <= prevN) return;

    const turns = conversation.slice(prevN);
    prevConvLenRef.current = conversation.length;

    const supabase = createClient();
    (async () => {
      for (const turn of turns) {
        if (savedIdsRef.current.has(turn.id)) continue;

        const { data: inserted } = await supabase
          .from("chat_messages")
          .insert({
            conversation_id: activeConversation,
            user_id: user.id,
            role: turn.role,
            content: turn.content,
          })
          .select("id")
          .single();

        if (inserted) {
          savedIdsRef.current.add(inserted.id);
          setDbMessages((prev) => [...prev, {
            id: inserted.id,
            role: turn.role,
            content: turn.content,
            created_at: new Date().toISOString(),
            source: "voice",
          }]);
        }
      }
    })();
  }, [conversation, activeConversation, user]);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (state === "connected") {
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [state]);

  const endCall = useCallback(() => {
    if (state === "connected") stop();
    router.push(`/${slug}/chat`);
  }, [state, stop, router, slug]);

  const all: ChatMsg[] = (() => {
    const merged = [...dbMessages];
    const seen = new Set(merged.map((m) => `${m.role}:${m.content.slice(0, 100)}`));
    for (const turn of conversation) {
      const key = `${turn.role}:${turn.content.slice(0, 100)}`;
      if (!seen.has(key)) {
        seen.add(key);
        merged.push({
          id: turn.id,
          role: turn.role,
          content: turn.content,
          created_at: new Date().toISOString(),
          source: "voice",
        });
      }
    }
    return merged.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  })();

  const lastUser = [...all].reverse().find((m) => m.role === "user");
  const lastAgent = [...all].reverse().find((m) => m.role === "assistant");

  if (authLoading || !user || !session) {
    return (
      <div className="min-h-screen bg-[#FBF7F0] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#3F5C3A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF7F0] flex flex-col relative overflow-hidden font-sans">
      <header className="p-12 max-lg:px-4 max-lg:py-6 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#3F5C3A] rounded-2xl flex items-center justify-center editorial">
              <svg className="w-6 h-6 text-[#FDFBF7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tighter uppercase">Aether Voice</h2>
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#3F5C3A]">Encrypted Learning Stream</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          {state === "connected" && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#3F5C3A] rounded-full animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#3F5C3A]">
                Call Duration {fmtDur(elapsed)}
              </span>
            </div>
          )}
            <button
              onClick={endCall}
              className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer btn-editorial-ghost"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center relative z-10 px-12 max-lg:px-4">
        {lastUser && (
          <section className="absolute left-16 top-1/2 -translate-y-1/2 w-[320px] space-y-4 max-lg:hidden">
            <div className="bg-[#FDFBF7] p-8 text-[#2D3436] editorial">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#3F5C3A] flex items-center justify-center text-[#FDFBF7] border border-[#2D3436] text-xs font-bold editorial">
                  {user?.user_metadata?.full_name?.charAt(0) || "U"}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#3F5C3A]">Your Voice</span>
              </div>
              <p className="text-sm leading-relaxed text-[#2D3436]/80">
                &ldquo;{lastUser.content.length > 200 ? lastUser.content.slice(0, 200) + "..." : lastUser.content}&rdquo;
              </p>
            </div>
          </section>
        )}
        <section className="flex flex-col items-center gap-12 max-lg:gap-6">
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 w-[400px] h-[400px] max-lg:w-[250px] max-lg:h-[250px] border border-[#3F5C3A]/10 rounded-full animate-pulse" />
            <div className="absolute inset-0 w-[300px] h-[300px] max-lg:w-[180px] max-lg:h-[180px] border border-[#3F5C3A]/5 rounded-full animate-ping" style={{ animationDuration: "3s" }} />
            <div className="relative z-20 floating">
              <div className={`w-40 h-40 max-lg:w-28 max-lg:h-28 rounded-full border-4 flex items-center justify-center overflow-hidden transition-all duration-500 ${
                state === "connected" ? "bg-[#3F5C3A] border-[#2D3436]" : "bg-[#FDFBF7] border-[#2D3436]"
              }`}>
                <svg className={`w-16 h-16 transition-colors duration-500 ${state === "connected" ? "text-[#FDFBF7]" : "text-[#3F5C3A]"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              {state === "connected" && (
                  <div className="absolute -bottom-2 right-4 bg-[#3F5C3A] px-3 py-1 rounded-full text-[8px] font-black uppercase text-[#FDFBF7] border-2 border-[#2D3436]">
                  {micActive ? "Listening" : "Speaking"}
                </div>
              )}
            </div>
          </div>
          <div className="waveform-container">
            {WAVE_BARS.map((bar, i) => (
              <div
                key={i}
                className="wave-bar"
                style={{
                  height: state === "connected" ? bar.h : "15%",
                  opacity: state === "connected" ? undefined : 0.4,
                  animationDelay: bar.delay,
                  animationPlayState: state === "connected" ? "running" : "paused",
                }}
              />
            ))}
          </div>
          <div className="text-center">
            {(state === "idle" || state === "connecting") && (
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#3F5C3A] animate-pulse">
                {state === "idle" ? "Initializing..." : "Connecting to Aether..."}
              </p>
            )}
            {state === "connected" && (
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#3F5C3A]">
                {micActive ? "Aether is listening..." : "Aether is explaining..."}
              </p>
            )}
            {state === "disconnected" && (
              <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#3F5C3A]">Session Ended</p>
                <button
                  onClick={() => { if (activeConversation) start(activeConversation); }}
                  className="btn-editorial font-bold px-8 py-3 rounded-full hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                >
                  Reconnect
                </button>
              </div>
            )}
          </div>
        </section>
        {lastAgent && (
          <section className="absolute right-16 top-1/2 -translate-y-1/2 w-[320px] max-lg:hidden">
            <div className="bg-[#FDFBF7] p-8 text-[#2D3436] max-h-[400px] overflow-y-auto editorial">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#3F5C3A] flex items-center justify-center text-white editorial">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#3F5C3A]">Aether Response</span>
              </div>
              <div className="text-sm leading-relaxed text-[#2D3436] whitespace-pre-wrap">
                {lastAgent.content.split("\n\n").map((para, i) => {
                  const rendered = para
                    .replace(/\*\*(.*?)\*\*/g, "<strong class='text-[#2D3436] font-bold'>$1</strong>")
                    .replace(/`(.*?)`/g, '<code class="text-[#3F5C3A] bg-[#2D3436]/10 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>')
                    .replace(/\*(.*?)\*/g, "<em class='italic text-[#3F5C3A]'>$1</em>");
                  return <p key={i} className="mb-3 last:mb-0" dangerouslySetInnerHTML={{ __html: rendered }} />;
                })}
              </div>
              <span className="typing-cursor" />
            </div>
          </section>
        )}
      </main>
      <footer className="p-12 pb-16 max-lg:px-4 max-lg:pb-8 max-lg:pt-6 flex justify-center relative z-20">
          <div className="bg-[#FDFBF7] px-10 py-5 max-lg:px-4 max-lg:py-3 flex items-center gap-10 max-lg:gap-3 rounded-[28px] border-2 border-[#2D3436] shadow-[4px_4px_0_0_#2D3436]">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMicMuted(!micActive)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                micActive
                  ? "btn-editorial"
                  : "btn-editorial-ghost"
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
            </button>
            <div className="flex items-center gap-3">
              <svg className="w-4 h-4 text-[#3F5C3A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
              </svg>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="volume-slider w-24 appearance-none bg-transparent cursor-pointer"
                style={{ marginTop: "2px" }}
              />
            </div>
          </div>

            <div className="w-px h-8 bg-[#2D3436]/15" />

            <button
              onClick={endCall}
              className="editorial bg-[#C9772E] text-[#FDFBF7] font-black px-10 py-4 max-lg:px-6 max-lg:py-3 rounded-full flex items-center gap-3 cursor-pointer"
            >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 3.75L18 6m0 0l2.25 2.25M18 6l2.25-2.25M18 6l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
            </svg>
            <span className="text-xs uppercase tracking-widest">End Session</span>
          </button>

            <div className="w-px h-8 bg-[#2D3436]/15" />

          <div className="flex items-center gap-4 relative group">
              <button className="w-12 h-12 rounded-full flex items-center justify-center cursor-not-allowed opacity-50 btn-editorial-ghost" disabled title="Screen Share - Arriving Soon">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
                <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-[8px] text-[#2D3436]/70 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">Arriving Soon</span>
              </button>
              <button
                onClick={() => setOutputMuted(!outputMuted)}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  outputMuted
                    ? "btn-editorial-ghost"
                    : "btn-editorial"
                }`}
                title="Volume Control - Arriving Soon"
              >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
            </button>
          </div>
        </div>
      </footer>


    </div>
  );
}