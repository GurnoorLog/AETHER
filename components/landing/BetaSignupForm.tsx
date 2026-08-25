"use client";

import { useState } from "react";
import { Check } from "lucide-react";

export default function BetaSignupForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/website-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "mobile-beta" }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setStatus("success");
        setMsg(
          data.already
            ? "You're already on the list — we'll be in touch!"
            : "You're on the list! We'll email you the moment Aether hits the stores."
        );
      } else if (data.error === "invalid_email") {
        setStatus("error");
        setMsg("Please enter a valid email address.");
      } else {
        setStatus("error");
        setMsg("Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setMsg("Network error. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        <div className="pop-check w-16 h-16 rounded-full bg-[#6B8E61] flex items-center justify-center shadow-lg">
          <Check className="text-white" size={32} strokeWidth={3} />
        </div>
        <p className="text-lg font-bold text-[#2D3436]">{msg}</p>
        <p className="text-sm text-[#A0A5A8]">Thanks for believing in Aether. 💚</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Animated email icon */}
      <div className="flex justify-center mb-6">
        <svg
          width="72"
          height="72"
          viewBox="0 0 72 72"
          className={`email-icon ${status === "loading" ? "is-sending" : ""}`}
          aria-hidden
        >
          <rect x="10" y="22" width="52" height="36" rx="8" fill="#6B8E61" />
          <rect x="10" y="22" width="52" height="36" rx="8" fill="#E8F1E6" opacity="0.0" />
          <path
            className="envelope-flap"
            d="M10 26 L36 46 L62 26"
            fill="none"
            stroke="#6B8E61"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            className="envelope-plane"
            d="M36 34 L52 28 L44 40 Z"
            fill="#E5B170"
          />
        </svg>
      </div>

      <form onSubmit={submit} className="flex flex-col md:flex-row gap-4 max-w-lg mx-auto">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email address"
          disabled={status === "loading"}
          className="flex-1 px-8 py-5 rounded-3xl bg-[#FDFBF7] border border-[#EFEBE5] focus:outline-none focus:border-[#6B8E61] text-lg disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="btn-primary px-10 py-5 rounded-3xl font-bold text-lg whitespace-nowrap disabled:opacity-70"
        >
          {status === "loading" ? "Joining…" : "Subscribe"}
        </button>
      </form>
      {status === "error" && (
        <p className="text-sm text-red-500 font-semibold mt-4">{msg}</p>
      )}
      {status === "idle" && (
        <p className="text-sm text-[#A0A5A8] font-medium mt-6">
          No spam, ever. Your privacy is our priority.
        </p>
      )}
    </div>
  );
}
