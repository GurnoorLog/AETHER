"use client";

import { useEffect, useState, useRef, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { useSession } from "../layout";
import { useDeepgramAgent } from "@deepgram/react";
import SidebarLeft from "@/components/SidebarLeft";
import SidebarRight from "@/components/SidebarRight";

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function VoiceTutorPage({ params }: { params: Promise<{ session: string }> }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.session;
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { session } = useSession();

  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [volume, setVolume] = useState(65);

  const { state, conversation, micActive, outputMuted, start, stop, setMicMuted, setOutputMuted, interrupt } = useDeepgramAgent({
    config: {
      auth: { tokenFactory: () => fetch("/api/deepgram-token").then((r) => r.text()) },
      agent: {
        listen: { provider: { type: "deepgram" }, model: "flux-general-en" },
        think: {
          provider: { type: "google" },
          model: "gemini-2.0-flash",
        },
        speak: { provider: { type: "deepgram" }, model: "aura-2-odysseus-en" },
      },
    },
    micOptions: { vad: true },
    playerSampleRate: 24_000,
  });

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

  const handleEndCall = useCallback(() => {
    if (state === "connected") stop();
    router.push(`/${slug}/chat`);
  }, [state, stop, router, slug]);

  const lastUserMsg = [...conversation].reverse().find((m) => m.role === "user");
  const lastAgentMsg = [...conversation].reverse().find((m) => m.role === "assistant");

  if (authLoading || !user || !session) {
    return (
      <div className="h-screen bg-deep-onyx text-white flex overflow-hidden">
        <div className="w-[15%] shrink-0 p-6 space-y-4">
          <div className="animate-pulse bg-white/5 rounded-2xl w-10 h-10" />
        </div>
        <main className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-cyber-yellow border-t-transparent rounded-full animate-spin" />
        </main>
        <div className="w-[20%] shrink-0 p-6">
          <div className="animate-pulse bg-white/5 rounded-[32px] h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#0A0A0A] text-white flex overflow-hidden font-sans">
      <SidebarLeft currentPage="voice-tutor" />

      <main className="flex-1 flex flex-col relative min-w-0 h-screen overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-cyber-yellow/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-cyber-yellow/5 rounded-full blur-[100px] pointer-events-none" />

        {/* Header */}
        <header className="p-8 pb-0 flex justify-between items-center relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-cyber-yellow rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(253,224,71,0.3)]">
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
        <div className="flex-1 flex items-center justify-center relative z-10 px-12">
          {/* User Transcription (Left) */}
          {lastUserMsg && (
            <section className="absolute left-16 top-1/2 -translate-y-1/2 w-[320px] space-y-4">
              <div className="rounded-[32px] p-8 bg-white/[0.08] backdrop-blur-[40px] border border-white/10 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)]"
                style={{ maskImage: "linear-gradient(to top, white 80%, transparent 100%)", WebkitMaskImage: "linear-gradient(to top, white 80%, transparent 100%)" }}>
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
            <div className="relative flex items-center justify-center">
              {/* Waveform Rings */}
              <div className="absolute inset-0 w-[400px] h-[400px] border border-cyber-yellow/10 rounded-full animate-pulse" />
              <div className="absolute inset-0 w-[300px] h-[300px] border border-cyber-yellow/5 rounded-full animate-ping" style={{ animationDuration: "3s" }} />

              {/* Avatar */}
              <div className="relative z-20" style={{ animation: "floating 6s ease-in-out infinite" }}>
                <div className={`w-40 h-40 rounded-full bg-black border-4 ${state === "connected" ? "border-cyber-yellow shadow-[0_0_40px_rgba(253,224,71,0.4)]" : "border-white/10"} flex items-center justify-center overflow-hidden transition-all duration-500`}>
                  <svg className={`w-16 h-16 ${state === "connected" ? "text-cyber-yellow" : "text-white/20"} transition-colors`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
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
            <div className="flex items-center justify-center gap-[6px] h-[200px]">
              {[
                "40%", "70%", "35%", "85%", "60%", "95%", "50%",
                "80%", "45%", "75%", "55%", "90%", "40%",
              ].map((h, i) => (
                <div
                  key={i}
                  className="w-[6px] rounded-full"
                  style={{
                    height: state === "connected" ? h : "15%",
                    backgroundColor: "#FDE047",
                    boxShadow: "0 0 15px rgba(253, 224, 71, 0.3)",
                    opacity: state === "connected" ? 1 : 0.3,
                    animation: state === "connected" ? `wave-animation 1.2s ease-in-out infinite` : "none",
                    animationDelay: `${-0.2 * (i + 1)}s`,
                    transition: "height 0.5s ease, opacity 0.5s ease",
                  }}
                />
              ))}
            </div>

            {/* Status text */}
            <div className="text-center">
              {state === "idle" && (
                <button
                  onClick={start}
                  className="bg-cyber-yellow text-black font-black px-10 py-4 rounded-full hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(253,224,71,0.3)] cursor-pointer"
                >
                  Start Voice Session
                </button>
              )}
              {state === "connecting" && (
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-cyber-yellow animate-pulse">
                  Connecting to Aether...
                </p>
              )}
              {state === "connected" && (
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-cyber-yellow">
                  {micActive ? "Aether is listening..." : "Aether is explaining..."}
                </p>
              )}
              {state === "disconnected" && (
                <div className="space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/40">Session Ended</p>
                  <button
                    onClick={start}
                    className="bg-cyber-yellow text-black font-black px-8 py-3 rounded-full hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(253,224,71,0.3)] cursor-pointer"
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
              <div className="rounded-[32px] p-8 bg-white/[0.08] backdrop-blur-[40px] border border-white/10 border-l-4 border-l-cyber-yellow shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)]"
                style={{ maskImage: "linear-gradient(to top, white 80%, transparent 100%)", WebkitMaskImage: "linear-gradient(to top, white 80%, transparent 100%)" }}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-cyber-yellow flex items-center justify-center text-black shadow-lg">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-cyber-yellow">Aether Response</span>
                </div>
                <p className="text-sm leading-relaxed text-white/90">
                  &ldquo;{lastAgentMsg.content.length > 300 ? lastAgentMsg.content.slice(0, 300) + "..." : lastAgentMsg.content}&rdquo;
                  <span className="inline-block w-[2px] h-[1.2em] bg-cyber-yellow ml-1 align-middle" style={{ animation: "blink 1s step-end infinite" }} />
                </p>
              </div>
            </section>
          )}
        </div>

        {/* Footer Controls */}
        <footer className="p-8 pb-12 flex justify-center relative z-20">
          <div className="rounded-full px-10 py-5 flex items-center gap-10 shadow-2xl border border-white/20 bg-white/[0.08] backdrop-blur-[40px]">
            {/* Mic toggle */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMicMuted(!micActive)}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  micActive
                    ? "bg-cyber-yellow text-black shadow-[0_0_15px_rgba(253,224,71,0.3)]"
                    : "bg-white/5 border border-white/10 hover:bg-white/10 text-white"
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
                  className="w-24 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-cyber-yellow"
                  style={{ accentColor: "#FDE047" }}
                />
              </div>
            </div>

            <div className="w-px h-8 bg-white/10" />

            {/* End call */}
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

            {/* Speaker & output toggle */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setOutputMuted(!outputMuted)}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  outputMuted
                    ? "bg-white/5 border border-white/10 text-white/40"
                    : "bg-cyber-yellow text-black shadow-lg"
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </button>
            </div>
          </div>
        </footer>

        {/* Conversation transcript panel (scrollable, bottom-left) */}
        {conversation.length > 0 && (
          <div className="absolute bottom-28 left-6 right-6 z-10 max-h-[180px] overflow-y-auto rounded-[24px] bg-black/40 backdrop-blur-xl border border-white/5 p-4 space-y-2 no-scrollbar">
            {[...conversation].reverse().slice(0, 10).map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[70%] px-4 py-2 rounded-2xl text-xs leading-relaxed ${
                  msg.role === "user"
                    ? "bg-white/10 text-white/80 rounded-br-md"
                    : "bg-cyber-yellow/10 text-cyber-yellow/90 rounded-bl-md"
                }`}>
                  {msg.content.length > 150 ? msg.content.slice(0, 150) + "..." : msg.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <SidebarRight />
    </div>
  );
}
