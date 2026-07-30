"use client";

import { useEffect, useRef, useState } from "react";
import Nav from "@/components/Nav";
import HeroSection from "@/components/HeroSection";
import FeatureBadges from "@/components/FeatureBadges";
import FeatureCards from "@/components/FeatureCards";
import LearningJourney from "@/components/LearningJourney";
import PricingSection from "@/components/PricingSection";
import CtaSection from "@/components/CtaSection";
import Footer from "@/components/Footer";
import BetaGateNotice from "@/components/BetaGateNotice";

export default function Home() {
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [bStatus, setBStatus] = useState("ACCEPTING SIGNUPS");
  const inputRef = useRef<HTMLInputElement>(null);
  const envelopeRef = useRef<SVGSVGElement>(null);
  const planeRef = useRef<SVGSVGElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
          }
        });
      },
      { threshold: 0.1 }
    );

    const currentRefs = sectionRefs.current;
    currentRefs.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => {
      currentRefs.forEach((el) => {
        if (el) observer.unobserve(el);
      });
    };
  }, []);

  const addToRefs = (el: HTMLElement | null) => {
    if (el && !sectionRefs.current.includes(el)) {
      sectionRefs.current.push(el);
    }
  };

  const handleBetaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputRef.current?.checkValidity()) { inputRef.current?.focus(); return; }
    setError("");
    let res;
    try {
      res = await fetch("/api/beta/request", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }),
      });
    } catch { setError("Something went wrong. Try again."); return; }
    const data = await res.json();
    if (data.error === "already_approved") { setError("Your email is already approved! Sign in to start learning."); return; }
    if (data.error === "already_requested") { setError("You've already signed up! We'll notify you when your slot opens."); return; }
    if (!res.ok) { setError("Something went wrong. Try again."); return; }
    setSent(true);
    setBStatus("MESSAGE DELIVERED");
    if (labelRef.current) labelRef.current.textContent = "✓ YOU'RE IN";
    envelopeRef.current?.classList.add("open");
    setTimeout(() => planeRef.current?.classList.add("fly"), 250);
    setTimeout(() => {
      setSent(false); setBStatus("ACCEPTING SIGNUPS"); setEmail("");
      if (labelRef.current) labelRef.current.textContent = "SUBSCRIBE";
      envelopeRef.current?.classList.remove("open");
      planeRef.current?.classList.remove("fly");
    }, 2600);
  };

  return (
    <div className="flex flex-col min-h-screen relative">
      <div className="fixed top-[-15%] right-[-10%] w-[800px] h-[800px] bg-cyber-yellow/10 rounded-full blur-[160px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[140px] pointer-events-none z-0" />

      <BetaGateNotice />
      <Nav />
      <HeroSection />
      <FeatureBadges />
      <section ref={addToRefs} className="reveal-on-scroll">
        <FeatureCards />
      </section>
      <section ref={addToRefs} className="reveal-on-scroll">
        <LearningJourney />
      </section>
      <section ref={addToRefs} className="reveal-on-scroll">
        <PricingSection />
      </section>
      <section ref={addToRefs} id="beta-section" className="reveal-on-scroll py-28 px-6">
        <style>{`
          @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
          .flap{transform-origin:60px 14px;transition:transform .55s cubic-bezier(.34,1.56,.64,1),opacity .55s}
          .envelope.open .flap{transform:translateY(-16px) rotate(-6deg);opacity:.85}
          .p{position:absolute;left:130px;top:70px;opacity:0;pointer-events:none}
          .p.fly{animation:flyOut 1.2s cubic-bezier(.2,.8,.2,1) forwards}
          @keyframes flyOut{0%{opacity:1;transform:translate(0,0) scale(.8) rotate(-20deg)}70%{opacity:1}100%{opacity:0;transform:translate(260px,-200px) scale(1.3) rotate(-20deg)}}
        `}</style>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-cyber-yellow text-xs font-black tracking-[0.25em] uppercase">Beta</span>
            <h2 className="text-4xl md:text-5xl font-black text-white mt-4 mb-4 tracking-tight">Get Early <span className="text-cyber-yellow">Access</span></h2>
            <p className="text-text-secondary text-sm font-bold max-w-xl mx-auto">We&apos;re onboarding in waves. Drop your email and we&apos;ll let you know when your slot opens.</p>
          </div>
          <div className="max-w-4xl mx-auto rounded-3xl border border-border bg-surface/50 backdrop-blur-sm p-8 md:p-12">
            <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
              <div className="flex-1 w-full">
                <div className="flex items-center gap-2 mb-6">
                  <span className="w-2 h-2 rounded-full bg-cyber-yellow shadow-[0_0_8px_#FDE047] flex-none" />
                  <span className="text-[12px] font-mono font-bold text-text-tertiary tracking-[.12em] uppercase">AETHER</span>
                  <span className="text-[11px] font-mono font-bold tracking-[.08em] text-text-primary border border-border px-3 py-[5px] rounded-full bg-charcoal whitespace-nowrap">CLOSED BETA</span>
                </div>
                <form onSubmit={handleBetaSubmit} className="flex gap-2.5 mb-4">
                  <div className="flex-1">
                    <input ref={inputRef} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" required autoComplete="email"
                      className="w-full bg-charcoal border border-border rounded-xl px-4 py-[15px] text-[15px] font-mono text-text-primary outline-none transition-[border-color,background,box-shadow] duration-250 placeholder:text-text-tertiary focus:border-cyber-yellow focus:bg-cyber-yellow/[0.03] focus:shadow-[0_0_0_3px_rgba(253,224,71,.1)]" />
                  </div>
                  <button type="submit" className={`relative overflow-hidden border-none rounded-xl px-6 py-[15px] font-mono font-bold text-[13px] tracking-[.08em] cursor-pointer whitespace-nowrap transition-[transform,background] duration-[0.18s,0.3s] hover:-translate-y-0.5 active:translate-y-0 active:scale-[.98] focus-visible:outline-2 focus-visible:outline-cyber-yellow focus-visible:outline-offset-3 ${sent ? "bg-cyber-yellow text-black" : "bg-white text-black"}`}>
                    <span ref={labelRef}>SUBSCRIBE</span>
                  </button>
                </form>
                {error && <p className={`text-xs font-mono font-bold mb-4 ${error.includes("already approved") ? "text-cyber-yellow" : "text-red-400/70"}`}>{error}</p>}
                <div className="flex flex-wrap gap-2.5 text-[11px] font-mono text-text-tertiary tracking-[.03em]">
                  <span>STATUS: <b className="text-cyber-yellow font-semibold">{bStatus}</b></span>
                  <span className="opacity-40">·</span>
                  <span>NO SPAM, EVER</span>
                </div>
              </div>
              <div className="shrink-0">
                <div className="relative w-[280px] h-[200px] sm:w-[340px] sm:h-[240px] flex items-center justify-center">
                  <div className="absolute inset-0 bg-cyber-yellow/5 rounded-full blur-3xl scale-150" />
                  <svg ref={envelopeRef} className="envelope relative" viewBox="0 0 120 84" width="220" height="155"
                    style={{ filter: "drop-shadow(0 24px 50px rgba(0,0,0,.55))", animation: "float 4s ease-in-out infinite" }}>
                    <defs>
                      <linearGradient id="c" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#f2f2f5"/><stop offset="35%" stopColor="#9a9aa2"/><stop offset="60%" stopColor="#e4e4e8"/><stop offset="100%" stopColor="#4a4a52"/></linearGradient>
                      <linearGradient id="cf" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ffffff"/><stop offset="100%" stopColor="#8a8a92"/></linearGradient>
                    </defs>
                    <rect x="2" y="14" width="116" height="68" rx="6" fill="url(#c)" stroke="#1a1a1d" strokeWidth="1.5" />
                    <polyline points="2,16 60,58 118,16" fill="none" stroke="#1a1a1d" strokeWidth="1.5" />
                    <g className="flap"><polygon points="2,14 60,54 118,14" fill="url(#cf)" stroke="#1a1a1d" strokeWidth="1.5" /></g>
                  </svg>
                  <svg ref={planeRef} className="p" viewBox="0 0 24 24" width="26" height="26"><path d="M2 12L21 3L14 21L11 13L2 12Z" fill="#FDE047" /></svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section ref={addToRefs} className="reveal-on-scroll">
        <CtaSection />
      </section>
      <Footer />
    </div>
  );
}
