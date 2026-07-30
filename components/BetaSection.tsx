"use client";

import { useState, useRef } from "react";

export default function BetaSection() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputRef.current?.checkValidity()) { inputRef.current?.focus(); return; }
    setError("");

    try {
      const res = await fetch("/api/beta/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      setSent(true);
      setTimeout(() => { setSent(false); setEmail(""); }, 3000);
    } catch {
      setError("Something went wrong. Try again.");
    }
  };

  return (
    <section className="relative py-28 px-6 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-[0.07]"
        style={{
          background: "radial-gradient(circle at 30% 40%, rgba(253,224,71,0.4) 0%, transparent 50%), radial-gradient(circle at 70% 60%, rgba(255,255,255,0.15) 0%, transparent 50%)"
        }}
      />
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <span className="w-2 h-2 rounded-full bg-cyber-yellow shadow-[0_0_8px_rgba(253,224,71,0.6)] animate-pulse" />
          <span className="text-[11px] font-black text-white/30 tracking-[0.15em] uppercase">AETHER</span>
          <span className="text-[11px] font-black text-cyber-yellow/60 border border-white/10 px-3 py-1 rounded-full">CLOSED BETA</span>
        </div>

        <h2 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight leading-[1.02]">
          Get Early<br />
          <span className="bg-gradient-to-r from-white via-white/70 to-white/30 bg-[length:250%_auto] bg-clip-text text-transparent animate-[sheen_5s_linear_infinite]"
            style={{ backgroundImage: "linear-gradient(115deg,#fff 0%,rgba(255,255,255,0.5) 30%,#fff 50%,rgba(255,255,255,0.3) 70%,#fff 100%)", backgroundSize: "250% auto" }}>
            Beta Access
          </span>
        </h2>

        <p className="text-white/30 text-sm font-bold max-w-lg mb-8 leading-relaxed">
          We&apos;re onboarding in waves. Drop your email and we&apos;ll let you know when your slot opens.
        </p>

        <form onSubmit={handleSubmit} className="flex gap-3 max-w-md">
          <div className="flex-1">
            <input
              ref={inputRef}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              required
              autoComplete="email"
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white font-bold outline-none transition-[border-color,background,box-shadow] duration-250 placeholder:text-white/20 focus:border-cyber-yellow/50 focus:bg-cyber-yellow/[0.03] focus:shadow-[0_0_0_3px_rgba(253,224,71,0.1)]"
            />
          </div>
          <button
            type="submit"
            className={`relative overflow-hidden rounded-xl px-6 py-3.5 text-xs font-black tracking-wider border transition-all duration-200 ${
              sent
                ? "bg-cyber-yellow text-black border-cyber-yellow"
                : "bg-white text-black border-white hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
            }`}
          >
            {sent ? "✓ REQUESTED" : "JOIN WAITLIST"}
          </button>
        </form>

        {error && <p className="text-red-400/70 text-xs font-bold mt-3">{error}</p>}

        <div className="flex gap-4 mt-6 text-[10px] font-bold text-white/20 tracking-wider">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyber-yellow/40" />
            STATUS: <span className="text-cyber-yellow/60">{sent ? "REQUEST SENT" : "ACCEPTING SIGNUPS"}</span>
          </span>
          <span className="opacity-30">·</span>
          <span>NO SPAM, EVER</span>
        </div>
      </div>
    </section>
  );
}
