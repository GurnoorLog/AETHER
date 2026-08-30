import type { Metadata } from "next";
import {
  ArrowRight,
  PlayCircle,
  Check,
  UploadCloud,
  Mic,
  Map,
  Brain,
  Users,
  Zap,
} from "lucide-react";
import LandingAuthButton from "@/components/landing/LandingAuthButton";
import BetaSignupForm from "@/components/landing/BetaSignupForm";

export const metadata: Metadata = {
  title: "Aether · A tutor that remembers how you think",
  description:
    "Upload your notes, talk to a tutor that remembers, and watch your mastery grow across any subject.",
};

function GraphDots({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" fill="none" className={className} aria-hidden>
      <path className="graph-line" d="M20 30 L60 60 L100 24 M60 60 L48 100 M60 60 L96 92" />
      <circle className="graph-node" cx="20" cy="30" r="4" />
      <circle className="graph-node-hollow" cx="60" cy="60" r="6" />
      <circle className="graph-node" cx="100" cy="24" r="4" />
      <circle className="graph-node" cx="48" cy="100" r="4" />
      <circle className="graph-node" cx="96" cy="92" r="4" />
    </svg>
  );
}

const features = [
  {
    icon: UploadCloud,
    title: "Multi-format upload",
    desc: "Drop in PDFs, slides, textbooks, code, or links. Aether indexes everything into your personal knowledge graph instantly.",
  },
  {
    icon: Mic,
    title: "Voice conversations",
    desc: "Talk naturally to your tutor in real time. Ask, clarify, and debate ideas the way you would with a human mentor.",
  },
  {
    icon: Map,
    title: "Visual mind palace",
    desc: "Watch your knowledge grow as a living concept map. Aether connects ideas across topics as you learn.",
  },
  {
    icon: Brain,
    title: "Infinite memory",
    desc: "Aether never forgets. Every concept and question stays retrievable, so you always pick up where you left off.",
  },
  {
    icon: Users,
    title: "Global community",
    desc: "Compare mastery, share insights, and climb leaderboards alongside a worldwide community of Aether learners.",
  },
  {
    icon: Zap,
    title: "Adaptive engine",
    desc: "Curriculum adjusts to your mastery in real time, reinforcing weak spots at the perfect moment for retention.",
  },
];

const steps = [
  { title: "Upload your material", desc: "Drag in any source: PDFs, slides, code, or YouTube links. Aether structures it into a knowledge base." },
  { title: "AI builds your curriculum", desc: "Aether maps concepts, builds a graph, and generates a personalized path with clear prerequisite chains." },
  { title: "Conversational tutoring", desc: "Chat or speak naturally. Get Socratic guidance and instant feedback tailored to how you think." },
  { title: "Mastery assessment", desc: "Adaptive quizzes target weak areas. Spaced repetition cements what you've learned for the long term." },
  { title: "Review & revisit", desc: "Reopen any concept anytime. Aether restores full context and re-adapts to close new gaps." },
];

const plans = [
  { name: "Free", price: "$0", suffix: "forever", blurb: "Dip your toes into personalized AI learning.", featured: false,
    features: ["1 active learning session", "10 AI chat messages / day", "3 knowledge uploads total", "2 quizzes / day", "5 min voice tutor / day", "Basic progress tracking"] },
  { name: "Pro", price: "$12", suffix: "/month", blurb: "For serious learners who want depth.", featured: true,
    features: ["10 active sessions", "200 AI messages / day", "50 uploads / month", "Unlimited quizzes", "60 min voice tutor / day", "AI music generation", "Full analytics & mastery"] },
  { name: "Unlimited", price: "$29", suffix: "/month", blurb: "Zero limits for the power learner.", featured: false,
    features: ["Unlimited sessions", "Unlimited AI chat & voice", "Unlimited uploads", "Priority AI model access", "Early access to features", "Priority 24/7 support"] },
];

export default function Home() {
  return (
    <div className="min-h-screen relative bg-[#FDFBF7] text-[#2D3436] font-sans overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-40 right-0 w-[640px] h-[640px] rounded-full bg-[radial-gradient(circle,rgba(107,142,97,0.10),transparent_60%)] blur-3xl" />
        <div className="absolute bottom-0 -left-40 w-[520px] h-[520px] rounded-full bg-[radial-gradient(circle,rgba(201,119,46,0.10),transparent_60%)] blur-3xl" />
      </div>

      <nav className="fixed top-0 inset-x-0 z-50 bg-[#FDFBF7]/80 backdrop-blur-xl border-b hairline">
        <div className="max-w-6xl mx-auto h-20 px-6 flex items-center justify-between">
          <a href="#" className="flex items-center gap-3">
            <span className="serif-display text-[#2D3436] font-semibold text-xl tracking-tight">Aether</span>
          </a>
          <div className="hidden md:flex items-center gap-9 text-sm font-medium text-[#555E61]">
            <a className="hover:text-[#3F5C3A] transition-colors relative after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-[#3F5C3A] after:transition-all hover:after:w-full" href="#features">Features</a>
            <a className="hover:text-[#3F5C3A] transition-colors relative after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-[#3F5C3A] after:transition-all hover:after:w-full" href="#journey">Method</a>
            <a className="hover:text-[#3F5C3A] transition-colors relative after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-[#3F5C3A] after:transition-all hover:after:w-full" href="#pricing">Pricing</a>
            <a className="hover:text-[#3F5C3A] transition-colors relative after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-[#3F5C3A] after:transition-all hover:after:w-full" href="#showcase">App</a>
          </div>
          <div className="flex items-center gap-3">
            <LandingAuthButton mode="login" className="text-sm font-medium text-[#2D3436] px-4 py-2 hover:text-[#3F5C3A] transition-colors">Log in</LandingAuthButton>
            <LandingAuthButton mode="signup" className="btn-primary btn-hard text-sm font-semibold px-6 py-2.5 rounded-xl">Get started</LandingAuthButton>
          </div>
        </div>
      </nav>

      <section className="relative pt-36 pb-24 px-6">
        <div className="max-w-3xl mx-auto flex flex-col items-center text-center">
          <div className="space-y-8">
            <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.18em] uppercase text-[#3F5C3A]">
              <span className="w-6 h-px bg-[#3F5C3A]" /> Issue 01 · Your AI tutor
            </span>
            <h1 className="serif-display text-5xl md:text-7xl leading-[0.98] text-[#2D3436] font-semibold">
              Learn like it{" "}
              <span className="relative inline-block italic text-[#3F5C3A]">
                finally gets you
                <svg className="absolute -bottom-2 left-0 w-full" height="12" viewBox="0 0 300 12" fill="none" preserveAspectRatio="none" aria-hidden>
                  <path d="M2 8 C 60 2, 120 11, 180 6 S 280 3, 298 7" stroke="#C9772E" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </span>
            </h1>
            <p className="max-w-md text-lg text-[#555E61] leading-relaxed">
              A personal AI tutor that adapts to how you study. Upload anything, ask anything, and master any subject, held in a memory that never lets go.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <LandingAuthButton mode="signup" className="btn-primary btn-hard px-7 py-4 rounded-xl text-base font-semibold flex items-center justify-center gap-2">
                Start learning
                <ArrowRight size={18} />
              </LandingAuthButton>
              <a href="#showcase" className="px-7 py-4 rounded-xl text-base font-semibold border hairline bg-white/50 hover:bg-white transition-colors flex items-center justify-center gap-2 text-[#555E61]">
                <PlayCircle size={20} className="text-[#C9772E]" />
                Watch demo
              </a>
            </div>
            <p className="text-sm text-[#A0A5A8]">Loved by 30 early learners · 4.5★ average so far</p>
          </div>
        </div>
      </section>

      <section className="px-6 py-10">
        <div className="max-w-6xl mx-auto flex items-center gap-6 border-y hairline py-6 overflow-x-auto">
          <span className="text-xs font-semibold tracking-[0.18em] uppercase text-[#A0A5A8] shrink-0">What you can study</span>
          {["Physics", "Mathematics", "Biology", "Chemistry", "Computer Science", "History", "English Literature"].map((t) => (
            <span key={t} className="serif-display text-lg text-[#2D3436]/70 whitespace-nowrap">{t}</span>
          ))}
        </div>
      </section>

      <section className="py-24 px-6" id="showcase">
        <div className="max-w-6xl mx-auto relative">
          <div className="flex items-end justify-between mb-12 gap-6 flex-wrap">
            <div>
              <span className="text-xs font-semibold tracking-[0.18em] uppercase text-[#3F5C3A]">The app</span>
              <h2 className="serif-display text-4xl md:text-5xl font-semibold mt-3">A tutor that lives in your pocket</h2>
            </div>
            <p className="text-[#555E61] max-w-sm">Learn on the go with our fully featured Android app. Coming soon to Google Play &amp; Samsung Galaxy Store.</p>
          </div>
          <div className="flex justify-center items-end gap-6 md:gap-10 flex-wrap lg:flex-nowrap">
            <div className="app-screen-mockup w-[250px] h-[500px] shrink-0 overflow-hidden transform -rotate-6 translate-y-10 hidden lg:block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/landing/screen-4.jpeg" className="w-full h-full object-cover" alt="Aether welcome screen" />
            </div>
            <div className="app-screen-mockup w-[270px] h-[540px] shrink-0 overflow-hidden z-20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/landing/screen-3.jpeg" className="w-full h-full object-cover" alt="Aether dashboard" />
            </div>
            <div className="app-screen-mockup w-[250px] h-[500px] shrink-0 overflow-hidden transform rotate-6 translate-y-10 hidden lg:block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/landing/screen-1.jpeg" className="w-full h-full object-cover" alt="Aether progress screen" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-white" id="features">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-14 max-w-2xl">
            <span className="text-xs font-semibold tracking-[0.18em] uppercase text-[#3F5C3A]">What's inside</span>
            <h2 className="serif-display text-4xl md:text-5xl font-semibold mt-3 mb-4">Built for the way you actually learn</h2>
            <p className="text-[#555E61]">No gimmicks. A toolkit grounded in learning science, so every session moves you forward.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
            {features.map((f, i) => (
              <div key={f.title} className="flex gap-5 items-start border-t hairline pt-6">
                <span className="serif-display text-2xl text-[#C9772E] w-8 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <f.icon size={18} className="text-[#3F5C3A]" />
                    <h3 className="text-xl font-bold">{f.title}</h3>
                  </div>
                  <p className="text-[#555E61] leading-relaxed text-sm">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-[#FDFBF7]" id="journey">
        <div className="max-w-4xl mx-auto">
          <span className="text-xs font-semibold tracking-[0.18em] uppercase text-[#3F5C3A]">The method</span>
          <h2 className="serif-display text-4xl md:text-5xl font-semibold mt-3 mb-12">Your learning journey in five moves</h2>
          <div className="relative">
            <div className="absolute left-[18px] top-2 bottom-2 w-px bg-[#E7E1D6]" />
            <div className="space-y-8">
              {steps.map((s, i) => (
                <div key={s.title} className="relative flex gap-6 items-start">
                  <span className="serif-display text-3xl text-[#3F5C3A] w-9 shrink-0 bg-[#FDFBF7]">{i + 1}</span>
                  <div className="border-t hairline pt-2">
                    <h4 className="text-lg font-bold mb-1">{s.title}</h4>
                    <p className="text-[#555E61] text-sm max-w-xl">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-12">
            <LandingAuthButton mode="signup" className="btn-primary btn-hard px-8 py-4 rounded-xl font-semibold inline-flex items-center gap-2">
              Get early access
              <ArrowRight size={18} />
            </LandingAuthButton>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-white" id="pricing">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-semibold tracking-[0.18em] uppercase text-[#3F5C3A]">Pricing</span>
            <h2 className="serif-display text-4xl md:text-5xl font-semibold mt-3 mb-3">Choose your path</h2>
            <p className="text-[#555E61]">Start free, upgrade when you outgrow it. No hidden fees, no surprises.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {plans.map((p) => (
              <div
                key={p.name}
                className={
                  p.featured
                    ? "relative bg-[#2F4730] text-white p-8 rounded-[255px_15px_225px_15px/15px_225px_15px_255px] border-2 border-[#FDFBF7]/50 shadow-[6px_6px_0_0_#2D3436] md:-translate-y-4"
                    : "editorial bg-[#FDFBF7] p-8"
                }
              >
                {p.featured && (
                  <div className="absolute -top-3 left-8 px-4 py-1 bg-[#C9772E] text-white text-[10px] font-bold uppercase tracking-widest rounded-full">
                    Most popular
                  </div>
                )}
                <h3 className={"text-xl font-bold mb-1 " + (p.featured ? "" : "text-[#2D3436]")}>{p.name}</h3>
                <p className={"text-sm mb-5 " + (p.featured ? "text-white/70" : "text-[#555E61]")}>{p.blurb}</p>
                <div className="text-4xl font-semibold mb-7 serif-display">
                  {p.price}
                  <span className={"text-sm font-normal " + (p.featured ? "text-white/60" : "text-[#A0A5A8]")}> {p.suffix}</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className={"flex items-center gap-3 text-sm " + (p.featured ? "text-white/90" : "text-[#2D3436]")}>
                      <Check className={p.featured ? "text-[#A7C49B] shrink-0" : "text-[#3F5C3A] shrink-0"} size={18} />
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="#beta"
                  className={
                    p.featured
                      ? "w-full py-4 rounded-xl bg-white text-[#2F4730] font-semibold text-center block"
                      : "w-full py-4 rounded-xl border hairline font-semibold text-center hover:bg-[#F1E9DE] transition-colors block"
                  }
                >
                  {p.featured ? "Subscribe now" : "Get started"}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-[#FDFBF7] overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold tracking-[0.18em] uppercase text-[#3F5C3A]">Mobile</span>
            <h2 className="serif-display text-4xl font-semibold mt-3">A beautiful mobile experience</h2>
            <p className="text-[#555E61] max-w-2xl mx-auto mt-3">
              Learn on the go with our fully featured Android app.
              <span className="font-semibold text-[#3F5C3A]"> Coming soon to Google Play &amp; Samsung Galaxy Store.</span>
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {["screen-1.jpeg", "screen-2.jpeg", "screen-3.jpeg", "screen-4.jpeg", "screen-5.jpeg"].map((src, i) => (
              <div
                key={src}
                className={
                  i === 2
                    ? "rounded-2xl border-2 border-[#2D3436] shadow-[4px_4px_0_0_#2D3436] overflow-hidden lg:translate-y-12"
                    : i === 1 || i === 3
                    ? "rounded-2xl border-2 border-[#2D3436] shadow-[4px_4px_0_0_#2D3436] overflow-hidden lg:translate-y-6"
                    : "rounded-2xl border-2 border-[#2D3436] shadow-[4px_4px_0_0_#2D3436] overflow-hidden"
                }
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/landing/${src}`} className="w-full" alt="Aether screen" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6" id="beta">
        <div className="max-w-4xl mx-auto bg-white p-10 md:p-16 text-center editorial relative overflow-hidden">
          <GraphDots className="absolute -bottom-8 -right-8 w-40 h-40 opacity-40" />
          <h2 className="serif-display text-4xl md:text-5xl font-semibold mb-5">Get early access</h2>
          <p className="text-lg text-[#555E61] mb-10">We're onboarding in waves. Drop your email and we'll let you know when your slot opens.</p>
          <BetaSignupForm />
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto editorial bg-[#2F4730] px-8 py-20 text-center relative overflow-hidden">
          <GraphDots className="absolute -top-8 -left-8 w-44 h-44 opacity-20" />
          <h2 className="serif-display text-4xl md:text-6xl font-semibold mb-6 text-white">Ready to learn differently?</h2>
          <p className="text-xl text-white/70 leading-relaxed mb-10 max-w-2xl mx-auto">Join the early learners who've already changed how they study. One conversation with Aether and you'll never go back to passive reading.</p>
          <LandingAuthButton mode="signup" className="bg-white text-[#2F4730] btn-hard px-10 py-5 rounded-xl text-lg font-semibold inline-flex items-center justify-center gap-3">
            Get started
          </LandingAuthButton>
        </div>
      </section>

      <footer className="py-14 border-t hairline">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-8">
            <div className="flex items-center gap-3">
              <span className="serif-display text-[#2D3436] font-semibold text-lg tracking-tight">Aether</span>
            </div>
            <div className="flex items-center gap-8 text-sm font-medium text-[#555E61]">
              <a href="#" className="hover:text-[#3F5C3A] transition-colors">Terms</a>
              <a href="#" className="hover:text-[#3F5C3A] transition-colors">Privacy</a>
              <a href="#" className="hover:text-[#3F5C3A] transition-colors">Community</a>
            </div>
          </div>
          <p className="text-sm text-[#A0A5A8]">© 2026 Aether Learning. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
