"use client";

import { useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { plans } from "@/lib/plans";

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleSelect = async (tier: string | null) => {
    if (!tier) return;
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
    <div className="flex flex-col min-h-screen relative">
      <div className="fixed top-[-15%] right-[-10%] w-[800px] h-[800px] bg-cyber-yellow/10 rounded-full blur-[160px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[140px] pointer-events-none z-0" />

      <Nav />
      <section className="py-28 px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-cyber-yellow text-xs font-black tracking-[0.25em] uppercase">Pricing</span>
            <h1 className="text-4xl md:text-6xl font-black text-white mt-4 mb-4 tracking-tight">
              Simple Plans for <span className="text-cyber-yellow">Serious Learning</span>
            </h1>
            <p className="text-white/40 text-sm font-bold max-w-xl mx-auto">
              Start free, upgrade when you outgrow it. No hidden fees, cancel anytime.
            </p>
          </div>

          {error && (
            <div className="max-w-2xl mx-auto mb-8 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-5">
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
                  <h2 className="text-white text-lg font-black mb-1">{plan.name}</h2>
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

          <p className="text-center text-white/25 text-xs font-bold mt-10">
            Prices in USD. Subscriptions billed monthly and managed through Stripe. Cancel anytime.
          </p>
        </div>
      </section>
      <Footer />
    </div>
  );
}