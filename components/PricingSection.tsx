"use client";

import { useState } from "react";
import { useAuthModal } from "@/hooks/useAuthModal";
import { useAuth } from "@/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { plans } from "@/lib/plans";

export default function PricingSection() {
  const { open } = useAuthModal();
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSelect = async (tier: string | null) => {
    if (!tier) {
      user ? router.push("/dashboard") : open("signup");
      return;
    }
    if (!user) {
      open("signup");
      return;
    }
    setLoading(tier);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } finally {
      setLoading(null);
    }
  };
  return (
    <section className="relative py-28 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-cyber-yellow text-xs font-black tracking-[0.25em] uppercase">Pricing</span>
          <h2 className="text-4xl md:text-5xl font-black text-white mt-4 mb-4 tracking-tight">
            Choose Your Path
          </h2>
          <p className="text-white/40 text-sm font-bold max-w-xl mx-auto">
            Start free, upgrade when you outgrow it. No hidden fees, no surprises.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-start">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 flex flex-col ${
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

              <div className="mb-8">
                <h3 className="text-white text-lg font-black mb-1">{plan.name}</h3>
                <p className="text-white/30 text-xs font-bold mb-6">{plan.desc}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-white text-4xl font-black">{plan.price}</span>
                  <span className="text-white/20 text-sm font-bold">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-10 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-3">
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
                className={`block w-full text-center text-sm font-black py-4 rounded-xl premium-transition cursor-pointer ${
                  plan.popular
                    ? "bg-cyber-yellow text-black hover:bg-cyber-yellow/90 hover:shadow-[0_0_30px_rgba(253,224,71,0.25)]"
                    : "bg-white/5 text-white/80 border border-white/10 hover:bg-white/10 hover:text-white"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading !== null && loading === plan.tier ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Loading...
                  </span>
                ) : (
                  plan.cta
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
