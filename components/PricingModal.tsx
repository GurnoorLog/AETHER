"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { plans } from "@/lib/plans";

export default function PricingModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState("");

  const select = async (tier: string | null) => {
    if (!tier) {
      onClose();
      return;
    }
    setBusy(tier);
    setErr("");
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
        setErr(data.error || "Something went wrong. Try again.");
        setBusy(null);
      }
    } catch {
      setErr("Something went wrong. Try again.");
      setBusy(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#FDFBF7] border border-[#E7E1D6] rounded-[28px] p-6 sm:p-10 my-8 editorial">
        <div className="flex items-start justify-between mb-2">
          <div>
            <span className="text-[#C9772E] text-xs font-black tracking-[0.25em] uppercase">Welcome to Aether</span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#2D3436] mt-2 tracking-tight">Choose Your Plan</h2>
            <p className="text-[#2D3436]/60 text-sm font-bold mt-2">
              Start free, upgrade when you outgrow it. No hidden fees.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-warm-ink/[0.04] flex items-center justify-center hover:bg-warm-ink/[0.06] transition-colors cursor-pointer shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {err && (
          <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-sm text-red-400 editorial">{err}</div>
        )}

        <div className="grid md:grid-cols-3 gap-5 mt-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-6 flex flex-col ${
                plan.popular
                  ? "bg-warm-ink/[0.04] border-2 border-[#C9772E]/40 shadow-[0_0_40px_rgba(201,119,46,0.08)]"
                  : "bg-warm-ink/[0.04] border border-[#E7E1D6]"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#C9772E] text-white text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest">
                  Most Popular
                </span>
              )}
              <div className="mb-6">
                <h3 className="text-[#2D3436] text-lg font-black mb-1">{plan.name}</h3>
                <p className="text-[#2D3436]/50 text-xs font-bold mb-4">{plan.desc}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-[#2D3436] text-4xl font-black">{plan.price}</span>
                  <span className="text-[#2D3436]/40 text-sm font-bold">{plan.period}</span>
                </div>
              </div>
              <ul className="space-y-2.5 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <svg className="w-4 h-4 mt-0.5 text-[#3F5C3A] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <span className="text-[#2D3436]/60 text-xs font-bold leading-relaxed">{f}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => select(plan.tier)}
                disabled={busy !== null}
                className={`block w-full text-center text-sm font-black py-3.5 rounded-xl transition-all cursor-pointer ${
                  plan.popular
                    ? "btn-editorial hover:bg-[#3F5C3A]/90 hover:shadow-[0_0_30px_rgba(63,92,58,0.25)]"
                    : "bg-warm-ink/[0.04] text-[#2D3436]/80 border border-[#E7E1D6] hover:bg-warm-ink/[0.06] hover:text-[#2D3436]"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {busy !== null && busy === plan.tier ? "Loading..." : plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}