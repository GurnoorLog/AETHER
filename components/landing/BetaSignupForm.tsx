"use client";

import { useRef, useState } from "react";

export default function BetaSignupForm() {
  const [email, setEmail] = useState("");
  const [label, setLabel] = useState("SUBSCRIBE");
  const [status, setStatus] = useState("ACCEPTING SIGNUPS");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const envelopeRef = useRef<SVGSVGElement>(null);
  const planeRef = useRef<SVGSVGElement>(null);

  function reset() {
    setSent(false);
    setStatus("ACCEPTING SIGNUPS");
    setLabel("SUBSCRIBE");
    setEmail("");
    envelopeRef.current?.classList.remove("open");
    planeRef.current?.classList.remove("fly");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!inputRef.current?.checkValidity()) {
      inputRef.current?.focus();
      return;
    }
    setError("");

    let res: Response;
    try {
      res = await fetch("/api/website-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "mobile-beta" }),
      });
    } catch {
      setError("Something went wrong. Try again.");
      return;
    }

    const data = await res.json();
    if (data.error === "invalid_email") {
      setError("Please enter a valid email address.");
      return;
    }
    if (!res.ok) {
      setError("Something went wrong. Try again.");
      return;
    }

    setSent(true);
    setStatus(data.already ? "ALREADY ON THE LIST" : "MESSAGE DELIVERED");
    setLabel(data.already ? "✓ YOU'RE IN" : "✓ YOU'RE IN");
    envelopeRef.current?.classList.add("open");
    setTimeout(() => planeRef.current?.classList.add("fly"), 250);
    setTimeout(reset, 2600);
  }

  return (
    <div className="w-full">
      <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
        {/* Form */}
        <div className="flex-1 w-full">
          <form onSubmit={submit} className="flex gap-2.5 mb-4">
            <div className="flex-1">
              <input
                ref={inputRef}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                required
                autoComplete="email"
                className="w-full bg-[#FDFBF7] border border-[#EFEBE5] rounded-2xl px-5 py-[15px] text-[15px] font-medium text-[#2D3436] outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-[#A0A5A8] focus:border-[#6B8E61] focus:shadow-[0_0_0_3px_rgba(107,142,97,0.12)]"
              />
            </div>
            <button
              type="submit"
              className={`relative overflow-hidden border-none rounded-2xl px-7 py-[15px] font-bold text-[13px] tracking-[0.08em] cursor-pointer whitespace-nowrap transition-[transform,background] duration-[0.18s,0.3s] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] ${
                sent ? "bg-[#6B8E61] text-white" : "bg-[#6B8E61] text-white"
              }`}
            >
              <span>{label}</span>
            </button>
          </form>

          {error && (
            <p className="text-xs font-bold text-red-500 mb-4">{error}</p>
          )}

          <div className="flex flex-wrap gap-2.5 text-[11px] font-bold tracking-[0.03em] text-[#A0A5A8]">
            <span>
              STATUS: <b className="text-[#6B8E61]">{status}</b>
            </span>
            <span className="opacity-40">·</span>
            <span>NO SPAM, EVER</span>
          </div>
        </div>

        {/* Envelope animation */}
        <div className="shrink-0">
          <div className="relative w-[240px] h-[180px] sm:w-[300px] sm:h-[210px] flex items-center justify-center">
            <div className="absolute inset-0 bg-[#6B8E61]/10 rounded-full blur-3xl scale-150" />
            <svg
              ref={envelopeRef}
              className="envelope relative"
              viewBox="0 0 120 84"
              width="200"
              height="140"
              style={{ filter: "drop-shadow(0 24px 50px rgba(45,52,54,0.25))", animation: "float 4s ease-in-out infinite" }}
            >
              <defs>
                <linearGradient id="c" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#f2f2f5" />
                  <stop offset="35%" stopColor="#9a9aa2" />
                  <stop offset="60%" stopColor="#e4e4e8" />
                  <stop offset="100%" stopColor="#4a4a52" />
                </linearGradient>
                <linearGradient id="cf" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#8a8a92" />
                </linearGradient>
              </defs>
              <rect x="2" y="14" width="116" height="68" rx="6" fill="url(#c)" stroke="#1a1a1d" strokeWidth="1.5" />
              <polyline points="2,16 60,58 118,16" fill="none" stroke="#1a1a1d" strokeWidth="1.5" />
              <g className="beta-flap">
                <polygon points="2,14 60,54 118,14" fill="url(#cf)" stroke="#1a1a1d" strokeWidth="1.5" />
              </g>
            </svg>
            <svg ref={planeRef} className="beta-plane" viewBox="0 0 24 24" width="26" height="26">
              <path d="M2 12L21 3L14 21L11 13L2 12Z" fill="#6B8E61" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
