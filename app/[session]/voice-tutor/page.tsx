"use client";

import { useEffect, useState, useRef, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { useSession } from "../layout";
import { createClient } from "@/lib/supabase/client";
import { useDeepgramAgent } from "@deepgram/react";

function formatDuration(seconds: number) {
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
  const resolvedParams = use(params);
  const slug = resolvedParams.session;
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { session } = useSession();

  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [volume, setVolume] = useState(65);

  // --- Shared conversation state ---
  const STORAGE_KEY = `aether_active_conversation_${slug}`;
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [dbMessages, setDbMessages] = useState<ChatMsg[]>([]);
  const savedIdsRef = useRef<Set<string>>(new Set());
  const prevConvLenRef = useRef(0);

  // --- Deepgram voice agent ---
  const { state, conversation, micActive, outputMuted, start, stop, setMicMuted, setOutputMuted } = useDeepgramAgent({
    config: {
      auth: { apiKey: process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY || "" },
      audio: {
        input: { encoding: "linear16", sampleRate: 16000 },
        output: { encoding: "linear16", sampleRate: 24000 },
      },
      agent: {
        listen: { provider: { type: "deepgram", version: "v2", model: "flux-general-en" } },
        think: {
          provider: { type: "google", model: "gemini-2.5-flash" },
          instructions: `You are Aether, an expert AI voice tutor. Your student is studying "${session?.subject || "a subject"}".

IMPORTANT RULES:
- Never ask what subject or topic the student is studying. You already know it.
- Never use asterisks (*), markdown, or any special formatting. You are speaking, not writing.
- Keep responses concise and conversational since this is voice.
- Always pick up right where the conversation left off — remember the full context.
- Be encouraging and clear. Use analogies and examples when helpful.`,
        },
        speak: { provider: { type: "deepgram", model: "aura-2-odysseus-en" } },
      },
      reconnect: { enabled: false },
    },
    micOptions: { vad: true },
    playerSampleRate: 24_000,
  });

  const [isMicMuted, setIsMicMuted] = useState(false);
  const toggleMic = () => {
    const next = !isMicMuted;
    setIsMicMuted(next);
    setMicMuted(next);
  };

  // --- Auto-connect on mount → triggers browser mic permission prompt ---
  const startedRef = useRef(false);
  useEffect(() => {
    if (state === "idle" && !startedRef.current) {
      startedRef.current = true;
      start();
    }
  }, [state, start]);

  // --- Load active conversation from localStorage ---
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setActiveConversation(saved);
  }, [STORAGE_KEY]);

  // --- Fetch existing messages from Supabase ---
  const fetchDbMessages = useCallback(async (convId: string) => {
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
    if (activeConversation) fetchDbMessages(activeConversation);
  }, [activeConversation, fetchDbMessages]);

  // --- Save new Deepgram conversation turns to Supabase ---
  useEffect(() => {
    if (!activeConversation || !user || conversation.length === 0) return;

    const prevLen = prevConvLenRef.current;
    if (conversation.length <= prevLen) return;

    const newTurns = conversation.slice(prevLen);
    prevConvLenRef.current = conversation.length;

    const supabase = createClient();
    (async () => {
      for (const turn of newTurns) {
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

  // --- Auth redirect ---
  useEffect(() => {
    if (!authLoading && !user) router.replace("/");
  }, [user, authLoading, router]);

  // --- Call timer ---
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

  // --- End call → navigate to chat ---
  const handleEndCall = useCallback(() => {
    if (state === "connected") stop();
    router.push(`/${slug}/chat`);
  }, [state, stop, router, slug]);

  // --- Merge DB messages + live Deepgram conversation (dedup by content+role) ---
  const allMessages: ChatMsg[] = (() => {
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

  const lastUserMsg = [...allMessages].reverse().find((m) => m.role === "user");
  const lastAgentMsg = [...allMessages].reverse().find((m) => m.role === "assistant");

  if (authLoading || !user || !session) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#FDE047] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col relative overflow-hidden font-sans">
      {/* Decorative glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#FDE047]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-[#FDE047]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="p-12 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#FDE047] rounded-2xl flex items-center justify-center">
            <svg className="w-6 h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tighter uppercase">Aether Voice</h2>
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">Encrypted Learning Stream</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          {state === "connected" && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">
                Call Duration {formatDuration(elapsed)}
              </span>
            </div>
          )}
          <button
            onClick={handleEndCall}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all border border-white/10 cursor-pointer"
          >
            <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Immersion Area */}
      <main className="flex-1 flex items-center justify-center relative z-10 px-12">
        {/* User Transcription (Left) */}
        {lastUserMsg && (
          <section className="absolute left-16 top-1/2 -translate-y-1/2 w-[320px] space-y-4">
            <div className="glass rounded-[32px] p-8 text-stream-fade">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center text-white/40 border border-white/10 text-xs font-bold">
                  {user?.user_metadata?.full_name?.charAt(0) || "U"}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Your Voice</span>
              </div>
              <p className="text-sm leading-relaxed text-white/80">
                &ldquo;{lastUserMsg.content.length > 200 ? lastUserMsg.content.slice(0, 200) + "..." : lastUserMsg.content}&rdquo;
              </p>
            </div>
          </section>
        )}

        {/* Center Visualization */}
        <section className="flex flex-col items-center gap-12">
          <div className="relative flex items-center justify-center overflow-hidden">
            <div className="relative z-20 floating">
              <div className={`w-40 h-40 rounded-full bg-black border-4 flex items-center justify-center overflow-hidden shadow-2xl transition-all duration-500 ${
                state === "connected" ? "border-[#FDE047] glow-pulse" : "border-white/10"
              }`}>
                <svg className={`w-16 h-16 transition-colors duration-500 ${state === "connected" ? "text-[#FDE047]" : "text-white/20"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              {state === "connected" && (
                <div className="absolute -bottom-2 right-4 bg-green-500 px-3 py-1 rounded-full text-[8px] font-black uppercase text-black border-2 border-black">
                  {micActive ? "Listening" : "Speaking"}
                </div>
              )}
            </div>
          </div>

          {/* Waveform Bars */}
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

          {/* Status */}
          <div className="text-center">
            {state === "idle" && (
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/40 animate-pulse">
                Initializing...
              </p>
            )}
            {state === "connecting" && (
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#FDE047] animate-pulse">
                Connecting to Aether...
              </p>
            )}
            {state === "connected" && (
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#FDE047]">
                {micActive ? "Aether is listening..." : "Aether is explaining..."}
              </p>
            )}
            {state === "disconnected" && (
              <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/40">Connection Lost</p>
                <button
                  onClick={() => { startedRef.current = false; start(); }}
                  className="bg-[#FDE047] text-black font-black px-8 py-3 rounded-full hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(253,224,71,0.3)] cursor-pointer"
                >
                  Reconnect
                </button>
              </div>
            )}
          </div>
        </section>

        {/* AI Response (Right) */}
        {lastAgentMsg && (
          <section className="absolute right-16 top-1/2 -translate-y-1/2 w-[320px] space-y-4">
            <div className="glass rounded-[32px] p-8 border-l-4 border-[#FDE047] text-stream-fade">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#FDE047] flex items-center justify-center text-black shadow-lg">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#FDE047]">Aether Response</span>
              </div>
              <p className="text-sm leading-relaxed text-white/90">
                &ldquo;{lastAgentMsg.content.length > 300 ? lastAgentMsg.content.slice(0, 300) + "..." : lastAgentMsg.content}&rdquo;
                <span className="typing-cursor" />
              </p>
            </div>
          </section>
        )}
      </main>

      {/* Footer Controls */}
      <footer className="p-12 pb-16 flex justify-center relative z-20">
        <div className="glass rounded-full px-10 py-5 flex items-center gap-10 shadow-2xl border border-white/20">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleMic}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                isMicMuted
                  ? "bg-white/5 border border-white/10 hover:bg-white/10 text-white"
                  : "bg-[#FDE047] text-black shadow-[0_0_15px_rgba(253,224,71,0.3)]"
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
            </button>
            <div className="flex items-center gap-3">
              <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
              </svg>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="volume-slider w-24 appearance-none bg-transparent cursor-pointer"
              />
            </div>
          </div>

          <div className="w-px h-8 bg-white/10" />

          <button
            onClick={handleEndCall}
            className="bg-red-500 text-white font-black px-10 py-4 rounded-full flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(239,68,68,0.3)] hover:shadow-[0_0_40px_rgba(239,68,68,0.5)] cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 3.75L18 6m0 0l2.25 2.25M18 6l2.25-2.25M18 6l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
            </svg>
            <span className="text-xs uppercase tracking-widest">End Session</span>
          </button>

          <div className="w-px h-8 bg-white/10" />

          <div className="flex items-center gap-4">
            <button className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all text-white/40 cursor-pointer">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
            </button>
            <button
              onClick={() => setOutputMuted(!outputMuted)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                outputMuted
                  ? "bg-white/5 border border-white/10 text-white/40"
                  : "bg-[#FDE047] text-black shadow-lg"
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
            </button>
          </div>
        </div>
      </footer>

      {/* Background Ticker */}
      <div className="absolute bottom-8 w-full flex justify-center opacity-10 grayscale px-24 pointer-events-none">
        <div className="flex gap-16 items-center">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22.282 9.821a5.985 5.985 0 00-.516-4.91 6.046 6.046 0 00-6.51-2.9A6.065 6.065 0 0014.293 3a5.985 5.985 0 00-4.407 1.957A6.046 6.046 0 003.5 10.46a6.065 6.065 0 00.725 5.176 5.985 5.985 0 00.516 4.91 6.046 6.046 0 006.51 2.9A6.065 6.065 0 009.707 21a5.985 5.985 0 004.407-1.957 6.046 6.046 0 008.369-7.714z" />
            </svg>
            <span className="font-black tracking-tighter">OPENAI</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 0-.36-.06-.52-.18-1.48-1.12-3.48-1.68-5.6-1.68-2.12 0-4.12.56-5.6 1.68-.16.12-.36.18-.56.18-.24 0-.48-.1-.66-.28-.18-.18-.28-.42-.28-.68 0-.26.1-.5.28-.68 1.78-1.34 4.2-2.02 6.82-2.02s5.04.68 6.82 2.02c.18.14.28.38.28.68 0 .26-.1.5-.28.68-.14.14-.34.22-.54.22z" />
            </svg>
            <span className="font-black tracking-tighter">FIGMA</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4.462 19.538c.456-.087.731-.491.656-.949l-.504-3.054H7.32l.84 5.114c.075.458-.2 0.862-.656.949l-4.042.94zm15.076-12.01l-1.557-.455L16.4 12.5l1.557.455 1.581-5.427zM12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 0-.36-.06-.52-.18-1.48-1.12-3.48-1.68-5.6-1.68-2.12 0-4.12.56-5.6 1.68-.16.12-.36.18-.56.18-.24 0-.48-.1-.66-.28-.18-.18-.28-.42-.28-.68 0-.26.1-.5.28-.68 1.78-1.34 4.2-2.02 6.82-2.02s5.04.68 6.82 2.02c.18.14.28.38.28.68 0 .26-.1.5-.28.68-.14.14-.34.22-.54.22z" />
            </svg>
            <span className="font-black tracking-tighter">NOTION</span>
          </div>
        </div>
      </div>


    </div>
  );
}
