import type { Metadata } from "next";
import {
  Leaf,
  ArrowRight,
  PlayCircle,
  Check,
  Star,
  BookOpen,
  Brain,
  Mic,
  Map,
  UploadCloud,
  Users,
  TrendingUp,
  Zap,
  Heart,
  User,
  Sparkles,
} from "lucide-react";
import LandingAuthButton from "@/components/landing/LandingAuthButton";
import BetaSignupForm from "@/components/landing/BetaSignupForm";

export const metadata: Metadata = {
  title: "Aether AI | Everything You Need to Learn Faster",
  description:
    "Your personal AI tutor that adapts to you. Study, practice, and master any subject with confidence.",
};

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

const stats = [
  { value: "30", label: "Active learners" },
  { value: "4.5", label: "Average rating" },
  { value: "3", label: "Sessions completed" },
];

const steps = [
  {
    n: 1,
    title: "Upload your material",
    desc: "Drag in any source — PDFs, slides, code, or YouTube links. Aether structures it into a knowledge base.",
  },
  {
    n: 2,
    title: "AI builds your curriculum",
    desc: "Aether maps concepts, builds a graph, and generates a personalized path with clear prerequisite chains.",
  },
  {
    n: 3,
    title: "Conversational tutoring",
    desc: "Chat or speak naturally. Get Socratic guidance and instant feedback tailored to how you think.",
  },
  {
    n: 4,
    title: "Mastery assessment",
    desc: "Adaptive quizzes target weak areas. Spaced repetition cements what you've learned for the long term.",
  },
  {
    n: 5,
    title: "Review & revisit",
    desc: "Reopen any concept anytime. Aether restores full context and re-adapts to close new gaps.",
  },
];

const plans = [
  {
    name: "Free",
    price: "$0",
    suffix: "forever",
    blurb: "Dip your toes into personalized AI learning.",
    features: [
      "1 active learning session",
      "10 AI chat messages / day",
      "3 knowledge uploads total",
      "2 quizzes / day",
      "5 min voice tutor / day",
      "Basic progress tracking",
    ],
    featured: false,
  },
  {
    name: "Pro",
    price: "$12",
    suffix: "/month",
    blurb: "For serious learners who want depth.",
    features: [
      "10 active sessions",
      "200 AI messages / day",
      "50 uploads / month",
      "Unlimited quizzes",
      "60 min voice tutor / day",
      "AI music generation",
      "Full analytics & mastery",
    ],
    featured: true,
  },
  {
    name: "Unlimited",
    price: "$29",
    suffix: "/month",
    blurb: "Zero limits for the power learner.",
    features: [
      "Unlimited sessions",
      "Unlimited AI chat & voice",
      "Unlimited uploads",
      "Priority AI model access",
      "Early access to features",
      "Priority 24/7 support",
    ],
    featured: false,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen relative bg-[#FDFBF7] text-[#2D3436] font-sans overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-48 left-1/2 -translate-x-1/2 w-[820px] h-[820px] rounded-full bg-[radial-gradient(circle,rgba(107,142,97,0.12),transparent_60%)] blur-3xl" />
        <div className="absolute top-1/3 -left-40 w-[520px] h-[520px] rounded-full bg-[radial-gradient(circle,rgba(229,177,112,0.14),transparent_60%)] blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[640px] h-[640px] rounded-full bg-[radial-gradient(circle,rgba(107,142,97,0.09),transparent_60%)] blur-3xl" />
      </div>

      <nav className="fixed top-0 inset-x-0 z-50 border-b border-[#EFEBE5]/70 bg-[#FDFBF7]/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto h-20 px-6 flex items-center justify-between">
          <a href="#" className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/landing/logo.png" alt="Aether" className="w-9 h-9 rounded-xl object-cover shadow-sm ring-1 ring-[#EFEBE5]" />
            <span className="text-[#2D3436] font-extrabold text-xl tracking-tight">Aether</span>
          </a>
          <div className="hidden lg:flex items-center gap-9 text-sm font-semibold text-[#555E61]">
            <a className="hover:text-[#6B8E61] transition-colors" href="#features">Features</a>
            <a className="hover:text-[#6B8E61] transition-colors" href="#journey">How it works</a>
            <a className="hover:text-[#6B8E61] transition-colors" href="#pricing">Pricing</a>
            <a className="hover:text-[#6B8E61] transition-colors" href="#showcase">Mobile app</a>
          </div>
          <div className="flex items-center gap-3">
            <LandingAuthButton mode="login" className="text-sm font-semibold text-[#2D3436] px-5 py-2.5 rounded-full hover:bg-[#F1E9DE] transition-colors">Log in</LandingAuthButton>
            <LandingAuthButton mode="signup" className="btn-primary text-sm font-bold px-6 py-2.5 rounded-full">Get started</LandingAuthButton>
          </div>
        </div>
      </nav>

      <section className="relative pt-36 pb-20 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-7">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#E8F1E6] text-[#4F6B47] text-xs font-bold tracking-wide border border-[#6B8E61]/15">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6B8E61] animate-pulse" />
              Your AI learning companion
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.02] text-[#2D3436]">
              Learn smarter with{" "}
              <span className="bg-gradient-to-r from-[#6B8E61] to-[#E5B170] bg-clip-text text-transparent">Aether</span>
            </h1>
            <p className="max-w-md text-lg text-[#555E61] leading-relaxed">
              A personal AI tutor that adapts to how you study. Upload anything, ask anything, and master any subject with confidence.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <LandingAuthButton mode="signup" className="btn-primary px-7 py-4 rounded-full text-base font-bold flex items-center justify-center gap-2">
                Start learning
                <ArrowRight size={18} />
              </LandingAuthButton>
              <a href="#showcase" className="px-7 py-4 rounded-full text-base font-bold border border-[#EFEBE5] bg-white/60 hover:border-[#6B8E61]/40 hover:bg-white transition-colors flex items-center justify-center gap-2 text-[#555E61]">
                <PlayCircle size={20} className="text-[#E5B170]" />
                Watch demo
              </a>
            </div>
            <div className="flex items-center gap-5 pt-3">
              <div className="flex -space-x-2.5">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="w-9 h-9 rounded-full bg-gradient-to-br from-[#6B8E61] to-[#E5B170] ring-2 ring-[#FDFBF7]" />
                ))}
              </div>
              <div className="text-sm leading-tight">
                <div className="flex items-center gap-1 text-[#2D3436] font-bold">
                  <Star size={14} className="fill-[#E5B170] text-[#E5B170]" />
                  4.5
                </div>
                <div className="text-[#A0A5A8]">from 30 learners</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="relative rounded-[36px] overflow-hidden ring-1 ring-[#EFEBE5] shadow-2xl bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/landing/hero.png" className="w-full h-auto" alt="Aether study illustration" />
            </div>
            <div className="absolute -left-5 sm:-left-8 top-12 w-64 rounded-3xl bg-white/85 backdrop-blur-xl border border-[#EFEBE5] shadow-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="text-[#6B8E61]" size={18} />
                  <span className="text-xs font-bold text-[#2D3436]">Gravitational forces</span>
                </div>
                <span className="text-xs font-bold text-[#6B8E61]">25%</span>
              </div>
              <div className="w-full h-1.5 bg-[#EFEBE5] rounded-full overflow-hidden">
                <div className="w-1/4 h-full bg-gradient-to-r from-[#6B8E61] to-[#E5B170]" />
              </div>
            </div>
            <div className="absolute -right-5 sm:-right-8 bottom-14 w-60 rounded-3xl bg-white/85 backdrop-blur-xl border border-[#EFEBE5] shadow-xl p-4">
              <p className="text-xs font-bold text-[#2D3436]">Kinematics &amp; Newton's laws</p>
              <div className="mt-3 flex items-center gap-2">
                <span className="px-2.5 py-1 bg-[#E8F1E6] text-[#6B8E61] text-[10px] font-bold rounded-full uppercase tracking-tight">In progress</span>
                <div className="flex-1 h-2 bg-[#EFEBE5] rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-px rounded-3xl overflow-hidden border border-[#EFEBE5] bg-[#EFEBE5]">
          {stats.map((s) => (
            <div key={s.label} className="bg-[#FDFBF7] px-6 py-8 text-center">
              <div className="text-3xl font-extrabold text-[#2D3436] tracking-tight">{s.value}</div>
              <div className="text-xs font-semibold text-[#A0A5A8] uppercase tracking-wide mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-28 px-6" id="showcase">
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#6B8E61]">The app</span>
            <h2 className="text-3xl md:text-4xl font-extrabold mt-3">A tutor that lives in your pocket</h2>
          </div>
          <div className="flex justify-center items-end gap-6 md:gap-12 flex-wrap lg:flex-nowrap">
            <div className="app-screen-mockup w-[260px] h-[520px] shrink-0 overflow-hidden transform -rotate-6 translate-y-12 hidden lg:block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/landing/screen-4.jpeg" className="w-full h-full object-cover" alt="Aether welcome screen" />
            </div>
            <div className="app-screen-mockup w-[280px] h-[560px] shrink-0 overflow-hidden z-20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/landing/screen-3.jpeg" className="w-full h-full object-cover" alt="Aether dashboard" />
            </div>
            <div className="app-screen-mockup w-[260px] h-[520px] shrink-0 overflow-hidden transform rotate-6 translate-y-12 hidden lg:block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/landing/screen-1.jpeg" className="w-full h-full object-cover" alt="Aether progress screen" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-28 bg-white" id="features">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mb-16">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#6B8E61]">Features</span>
            <h2 className="text-4xl md:text-5xl font-extrabold mt-3 mb-4">Built for the way you actually learn</h2>
            <p className="text-[#555E61]">A toolkit grounded in learning science, not gimmicks — so every session moves you forward.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="group bg-[#FDFBF7] p-8 rounded-[32px] border border-[#EFEBE5] hover:border-[#6B8E61]/30 hover:shadow-[0_24px_50px_-20px_rgba(107,142,97,0.25)] transition-all duration-300">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#EDF3EA] to-[#F1E9DE] text-[#6B8E61] flex items-center justify-center mb-6 shadow-[0_8px_22px_-10px_rgba(107,142,97,0.45)] group-hover:scale-110 transition-transform duration-300">
                  <f.icon size={24} />
                </div>
                <h3 className="text-xl font-bold mb-2">{f.title}</h3>
                <p className="text-[#555E61] leading-relaxed text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-28 px-6 bg-[#FDFBF7]" id="journey">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-16">
            <div className="lg:w-1/3">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#6B8E61]">How it works</span>
              <h2 className="text-4xl md:text-5xl font-extrabold mt-3 mb-6 leading-tight">Your learning journey in 5 steps</h2>
              <p className="text-lg text-[#555E61] mb-8">
                From your first upload to true mastery, Aether guides a proven loop built for speed and retention.
              </p>
              <LandingAuthButton mode="signup" className="btn-primary px-8 py-4 rounded-full font-bold inline-flex items-center gap-2">
                Get early access
                <ArrowRight size={18} />
              </LandingAuthButton>
            </div>
            <div className="lg:w-2/3 space-y-4">
              {steps.map((s) => (
                <div key={s.n} className="bg-white p-6 rounded-[28px] border border-[#EFEBE5] flex gap-5 items-start hover:shadow-[0_18px_40px_-20px_rgba(0,0,0,0.12)] transition-shadow">
                  <span className="w-10 h-10 bg-[#6B8E61] text-white rounded-full flex items-center justify-center font-bold shrink-0">{s.n}</span>
                  <div>
                    <h4 className="text-lg font-bold mb-1">{s.title}</h4>
                    <p className="text-[#555E61] text-sm">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-28 px-6 bg-white" id="pricing">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#6B8E61]">Pricing</span>
            <h2 className="text-4xl md:text-5xl font-extrabold mt-3 mb-4">Choose your path</h2>
            <p className="text-[#555E61]">Start free, upgrade when you outgrow it. No hidden fees, no surprises.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {plans.map((p) => (
              <div
                key={p.name}
                className={
                  p.featured
                    ? "relative bg-[#FDFBF7] p-9 rounded-[40px] border-2 border-[#6B8E61] shadow-[0_30px_60px_-25px_rgba(107,142,97,0.45)] flex flex-col h-full"
                    : "bg-[#FDFBF7] p-9 rounded-[40px] border border-[#EFEBE5] flex flex-col h-full"
                }
              >
                {p.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-[#6B8E61] text-white text-[10px] font-bold uppercase tracking-widest rounded-full">
                    Most popular
                  </div>
                )}
                <h3 className="text-xl font-bold mb-1">{p.name}</h3>
                <p className="text-[#555E61] text-sm mb-5">{p.blurb}</p>
                <div className="text-4xl font-extrabold mb-7">
                  {p.price}
                  <span className="text-sm text-[#A0A5A8] font-normal"> {p.suffix}</span>
                </div>
                <ul className="space-y-3 mb-9 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm text-[#2D3436]">
                      <Check className="text-[#6B8E61] shrink-0" size={18} />
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="#beta"
                  className={
                    p.featured
                      ? "w-full py-4 rounded-full btn-primary font-bold text-center"
                      : "w-full py-4 rounded-full border border-[#EFEBE5] font-bold text-center hover:bg-[#F1E9DE] transition-colors"
                  }
                >
                  {p.featured ? "Subscribe now" : "Get started"}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-28 px-6 bg-[#FDFBF7] overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#6B8E61]">Mobile</span>
            <h2 className="text-4xl font-extrabold mt-3">A beautiful mobile experience</h2>
            <p className="text-[#555E61] max-w-2xl mx-auto mt-3">
              Learn on the go with our fully featured Android app.
              <span className="font-bold text-[#6B8E61]"> Coming soon to Google Play &amp; Samsung Galaxy Store.</span>
            </p>
            <div className="flex items-center justify-center gap-3 mt-6">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#E8F1E6] text-[#6B8E61] text-xs font-bold">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M3.6 2.3 13 11.7l-9.4 9.4c-.5-.3-.8-1-.8-2.3V4.6c0-1.3.3-2 1.8-2.3zM16.8 8.4 13.7 5.3 4.6 14.4l3.1 3.1 9.1-9.1zM17.4 9l3.2-3.2c-.8-.6-1.9-.9-3.1-.9-.9 0-1.7.2-2.4.6L14 6.6l3.4 3.4zM4.6 1.8 14.2 11.4l1.6-1.6-9.4-9.4c-.6.3-1.4.9-2.3 1.4z" /></svg>
                Google Play — Coming soon
              </span>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F1E9DE] text-[#A8763E] text-xs font-bold">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 2 4 7v10l8 5 8-5V7l-8-5zm0 2.3 6 3.75v7.9l-6 3.75-6-3.75v-7.9l6-3.75z" /></svg>
                Galaxy Store — Coming soon
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {["screen-1.jpeg", "screen-2.jpeg", "screen-3.jpeg", "screen-4.jpeg", "screen-5.jpeg"].map((src, i) => (
              <div
                key={src}
                className={
                  i === 2
                    ? "rounded-3xl border-4 border-white shadow-lg overflow-hidden lg:translate-y-16"
                    : i === 1 || i === 3
                    ? "rounded-3xl border-4 border-white shadow-lg overflow-hidden lg:translate-y-8"
                    : "rounded-3xl border-4 border-white shadow-lg overflow-hidden"
                }
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/landing/${src}`} className="w-full" alt="Aether screen" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-28 px-6" id="beta">
        <div className="max-w-4xl mx-auto bg-white rounded-[48px] p-10 md:p-16 text-center border border-[#EFEBE5] shadow-2xl relative overflow-hidden">
          <div className="absolute top-8 right-8 flex items-center gap-2 px-4 py-1.5 bg-[#E8F1E6] rounded-full border border-[#6B8E61]/20">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-[#6B8E61] uppercase tracking-widest">Accepting signups</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6">Get early access</h2>
          <p className="text-lg text-[#555E61] mb-10">We're onboarding in waves. Drop your email and we'll let you know when your slot opens.</p>
          <BetaSignupForm />
          <div className="mt-12 text-[#EFEBE5] text-[56px] md:text-[72px] font-black tracking-tighter opacity-20 pointer-events-none uppercase select-none">Aether closed beta</div>
        </div>
      </section>

      <section className="py-28 px-6">
        <div className="max-w-5xl mx-auto rounded-[48px] bg-gradient-to-br from-[#6B8E61] to-[#557A4E] px-8 py-20 text-center shadow-[0_40px_80px_-30px_rgba(107,142,97,0.5)]">
          <h2 className="text-4xl md:text-6xl font-extrabold mb-6 text-white">Ready to supercharge your learning?</h2>
          <p className="text-xl text-white/80 leading-relaxed mb-10 max-w-2xl mx-auto">Join thousands of students who've changed how they learn. One conversation with Aether and you'll never study the same way again.</p>
          <LandingAuthButton mode="signup" className="bg-white text-[#2D3436] px-10 py-5 rounded-full text-lg font-bold inline-flex items-center justify-center gap-3 hover:scale-[1.02] transition-transform">
            Join the revolution
            <Sparkles size={20} className="text-[#6B8E61]" />
          </LandingAuthButton>
        </div>
      </section>

      <footer className="py-14 border-t border-[#EFEBE5]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-8">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/landing/logo.png" alt="Aether" className="w-8 h-8 rounded-lg object-cover shadow-sm ring-1 ring-[#EFEBE5]" />
              <span className="text-[#2D3436] font-extrabold text-lg tracking-tight">Aether</span>
            </div>
            <div className="flex items-center gap-8 text-sm font-semibold text-[#555E61]">
              <a href="#" className="hover:text-[#6B8E61] transition-colors">Terms</a>
              <a href="#" className="hover:text-[#6B8E61] transition-colors">Privacy</a>
              <a href="#" className="hover:text-[#6B8E61] transition-colors">Community</a>
            </div>
          </div>
          <p className="text-sm text-[#A0A5A8]">© 2026 Aether Learning. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
