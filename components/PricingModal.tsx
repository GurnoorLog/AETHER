"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { plans } from "@/lib/plans";

export default function PricingModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleSelect = async (tier: string | null) => {
    if (!tier) {
      onClose();
      return;
    }
    setLoading(tier);
    setError("");
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Something went wrong. Try again.");
        setLoading(null);
      }
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-deep-onyx border border-white/10 rounded-[28px] p-6 sm:p-10 my-8">
        <div className="flex items-start justify-between mb-2">
          <div>
            <span className="text-cyber-yellow text-xs font-black tracking-[0.25em] uppercase">Welcome to Aether</span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-2 tracking-tight">Choose Your Plan</h2>
            <p className="text-white/40 text-sm font-bold mt-2">
              Start free, upgrade when you outgrow it. No hidden fees.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-sm text-red-400">{error}</div>
        )}

        <div className="grid md:grid-cols-3 gap-5 mt-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-6 flex flex-col ${
                plan.popular
                  ? "bg-white/5 border-2 border-cyber-yellow/40 shadow-[0_0_40px_rgba(253,224,71,0.08)]"
                  : "bg-white/[0.03] border border-white/10"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cyber-yellow text-black text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest">
                  Most Popular
                </span>
              )}
              <div className="mb-6">
                <h3 className="text-white text-lg font-black mb-1">{plan.name}</h3>
                <p className="text-white/30 text-xs font-bold mb-4">{plan.desc}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-white text-4xl font-black">{plan.price}</span>
                  <span className="text-white/20 text-sm font-bold">{plan.period}</span>
                </div>
              </div>
              <ul className="space-y-2.5 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <svg className="w-4 h-4 mt-0.5 text-cyber-yellow shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <span className="text-white/60 text-xs font-bold leading-relaxed">{f}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSelect(plan.tier)}
                disabled={loading !== null}
                className={`block w-full text-center text-sm font-black py-3.5 rounded-xl transition-all cursor-pointer ${
                  plan.popular
                    ? "bg-cyber-yellow text-black hover:bg-cyber-yellow/90 hover:shadow-[0_0_30px_rgba(253,224,71,0.25)]"
                    : "bg-white/5 text-white/80 border border-white/10 hover:bg-white/10 hover:text-white"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading !== null && loading === plan.tier ? "Loading..." : plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}