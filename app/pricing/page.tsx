"use client";

import { useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { plans } from "@/lib/plans";

export default function PricingPage() {
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState("");

  const pick = async (tier: string | null) => {
    if (!tier) return;
    setBusy(tier);
    setErr("");
    try {
      const resp = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const data = await resp.json();
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
    <div className="flex flex-col min-h-screen relative">
      <div className="fixed top-[-15%] right-[-10%] w-[800px] h-[800px] bg-sage/10 rounded-full blur-[160px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-[#3F5C3A]/5 rounded-full blur-[140px] pointer-events-none z-0" />

      <Nav />
      <section className="py-28 px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-sage text-xs font-black tracking-[0.25em] uppercase">Pricing</span>
            <h1 className="text-4xl md:text-6xl font-black text-warm-ink mt-4 mb-4 tracking-tight">
              Simple Plans for <span className="text-sage">Serious Learning</span>
            </h1>
            <p className="text-warm-ink-muted text-sm font-bold max-w-xl mx-auto">
              Start free, upgrade when you outgrow it. No hidden fees, cancel anytime.
            </p>
          </div>

          {err && (
            <div className="max-w-2xl mx-auto mb-8 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-sm text-red-400 editorial">
              {err}
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-5">
            {plans.map((p) => {
              let cardCls = "bg-warm-ink/[0.04] border border-hairline-warm";
              if (p.popular) {
                cardCls = "bg-warm-ink/[0.04] border-2 border-sage/40 shadow-[0_0_40px_rgba(63,92,58,0.08)]";
              }

              let btnCls =
                "block w-full text-center text-sm font-black py-3.5 rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
              if (p.popular) {
                btnCls += " btn-editorial hover:bg-sage/90 hover:shadow-[0_0_30px_rgba(63,92,58,0.25)]";
              } else {
                btnCls +=
                  " bg-warm-ink/[0.04] text-warm-ink-soft border border-hairline-warm hover:bg-warm-ink/[0.05] hover:text-warm-ink";
              }

              let label = p.cta;
              if (busy !== null && busy === p.tier) label = "Loading...";

              return (
                <div key={p.name} className={`relative rounded-2xl p-6 flex flex-col ${cardCls}`}>
                  {p.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 btn-editorial text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest">
                      Most Popular
                    </span>
                  )}
                  <div className="mb-6">
                    <h2 className="text-warm-ink text-lg font-black mb-1">{p.name}</h2>
                    <p className="text-warm-ink-faint text-xs font-bold mb-4">{p.desc}</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-warm-ink text-4xl font-black">{p.price}</span>
                      <span className="text-warm-ink-faint text-sm font-bold">{p.period}</span>
                    </div>
                  </div>
                  <ul className="space-y-2.5 mb-8 flex-1">
                    {p.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2.5">
                        <svg className="w-4 h-4 mt-0.5 text-sage shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        <span className="text-warm-ink-soft text-xs font-bold leading-relaxed">{feat}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => pick(p.tier)}
                    disabled={busy !== null}
                    className={btnCls}
                  >
                    {label}
                  </button>
                </div>
              );
            })}
          </div>

          <p className="text-center text-warm-ink-faint text-xs font-bold mt-10">
            Prices in USD. Subscriptions billed monthly and managed through Stripe. Cancel anytime.
          </p>
        </div>
      </section>
      <Footer />
    </div>
  );
}
