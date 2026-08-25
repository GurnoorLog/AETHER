import type { Metadata } from "next";
import {
  Leaf,
  ArrowRight,
  PlayCircle,
  User,
  TrendingUp,
  BookOpen,
  Heart,
  Book,
  UploadCloud,
  Mic,
  Map,
  Brain,
  Users,
  Zap,
  Check,
} from "lucide-react";
import LandingAuthButton from "@/components/landing/LandingAuthButton";
import BetaSignupForm from "@/components/landing/BetaSignupForm";

export const metadata: Metadata = {
  title: "Aether AI | Everything You Need to Learn Faster",
  description:
    "Your personal AI tutor that adapts to you. Study, practice, and master any subject with confidence.",
};

export default function Home() {
  return (
    <div className="min-h-screen relative bg-[#FDFBF7] text-[#2D3436] font-sans overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#FDFBF7]/80 backdrop-blur-md border-b border-[#EFEBE5]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/landing/logo.png" alt="Aether" className="w-9 h-9 rounded-xl object-cover shadow-sm" />
            <span className="text-[#2D3436] font-bold text-2xl tracking-tight uppercase">Aether</span>
          </div>
          <div className="hidden lg:flex items-center gap-10">
            <a href="#features" className="text-sm font-semibold hover:text-[#6B8E61] transition-colors">Features</a>
            <a href="#journey" className="text-sm font-semibold hover:text-[#6B8E61] transition-colors">How It Works</a>
            <a href="#pricing" className="text-sm font-semibold hover:text-[#6B8E61] transition-colors">Pricing</a>
            <a href="#showcase" className="text-sm font-semibold hover:text-[#6B8E61] transition-colors">Mobile App</a>
          </div>
          <div className="flex items-center gap-4">
            <LandingAuthButton mode="login" className="text-sm font-semibold text-[#2D3436] px-6 py-2.5 rounded-2xl hover:bg-[#F1E9DE] transition-all">Log in</LandingAuthButton>
            <LandingAuthButton mode="signup" className="btn-primary text-sm font-bold px-8 py-3 rounded-2xl shadow-sm">Get Started</LandingAuthButton>
          </div>
        </div>
      </nav>

      {/* Redesigned Hero Section (split layout) */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -right-24 w-[460px] h-[460px] rounded-full bg-[#E8F1E6] blur-[140px] opacity-70" />
          <div className="absolute top-48 -left-28 w-[380px] h-[380px] rounded-full bg-[#F6EFE0] blur-[140px] opacity-60" />
        </div>
        <div className="max-w-7xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Side: Content */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#E8F1E6] text-[#6B8E61] rounded-full text-xs font-bold tracking-tight shadow-sm">
                <Leaf size={18} />
                Your AI Learning Companion
              </div>
              <h1 className="text-6xl md:text-[88px] font-bold tracking-tight leading-[0.95] text-[#2D3436]">
                Learn smarter <br />
                with <span className="text-[#6B8E61]">Aether</span>
              </h1>
              <p className="max-w-md text-xl text-[#555E61] leading-relaxed font-medium">
                Your personal AI tutor that adapts to you. Study, practice, and master any subject with confidence.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <LandingAuthButton mode="signup" className="btn-primary px-8 py-4 rounded-full text-lg font-bold flex items-center justify-center gap-3 shadow-lg">
                  Start Learning
                  <span className="bg-white/20 rounded-full p-1 flex items-center justify-center">
                    <ArrowRight className="text-white" size={18} />
                  </span>
                </LandingAuthButton>
                <a href="#" className="px-8 py-4 rounded-full text-lg font-bold bg-white border border-[#EFEBE5] hover:border-[#6B8E61] transition-all flex items-center justify-center gap-3 shadow-sm text-[#555E61]">
                  Watch Demo
                  <PlayCircle className="text-[#D9C4A9]" size={24} />
                </a>
              </div>

              {/* Mini Features Grid */}
              <div className="grid grid-cols-2 gap-x-8 gap-y-6 pt-10 border-t border-[#EFEBE5]">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#F1E9DE] flex items-center justify-center text-[#6B8E61]">
                    <User size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#2D3436]">Personalized</p>
                    <p className="text-[10px] text-[#A0A5A8] font-bold uppercase">for you</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#F1E9DE] flex items-center justify-center text-[#E5B170]">
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#2D3436]">Tracks</p>
                    <p className="text-[10px] text-[#A0A5A8] font-bold uppercase">your progress</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#F1E9DE] flex items-center justify-center text-[#5E7DA3]">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#2D3436]">Covers all</p>
                    <p className="text-[10px] text-[#A0A5A8] font-bold uppercase">subjects</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#F1E9DE] flex items-center justify-center text-[#6B8E61]">
                    <Heart size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#2D3436]">Always</p>
                    <p className="text-[10px] text-[#A0A5A8] font-bold uppercase">by your side</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side: Visual Illustration Area */}
            <div className="relative">
              <div className="relative rounded-[64px] overflow-hidden shadow-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/landing/hero.png" className="w-full h-auto" alt="Aether Study Illustration" />
              </div>

              {/* Floating UI Elements */}
              <div className="absolute -top-10 -right-4 w-72 bg-white/80 backdrop-blur-xl rounded-3xl p-5 shadow-2xl border border-[#EFEBE5]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Book className="text-[#6B8E61]" size={20} />
                    <span className="text-xs font-bold text-[#2D3436]">Exploring Gravitational Forces</span>
                  </div>
                  <span className="text-xs font-bold text-[#6B8E61]">25%</span>
                </div>
                <div className="w-full h-1.5 bg-[#EFEBE5] rounded-full overflow-hidden">
                  <div className="w-1/4 h-full bg-[#6B8E61]" />
                </div>
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center">
                  <Heart className="text-red-500" size={14} />
                </div>
              </div>

              <div className="absolute bottom-20 -right-8 w-64 bg-white/80 backdrop-blur-xl rounded-3xl p-5 shadow-2xl border border-[#EFEBE5]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-[#2D3436]">Kinematics and</p>
                    <p className="text-xs font-bold text-[#2D3436]">Newton's Laws</p>
                  </div>
                  <span className="px-3 py-1 bg-[#E8F1E6] text-[#6B8E61] text-[10px] font-bold rounded-full uppercase tracking-tighter">Current</span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#6B8E61]" />
                  <div className="w-24 h-2 bg-[#EFEBE5] rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* App Preview Floating (3 phone mockups) */}
      <section className="pb-32 px-6 overflow-hidden mt-[-60px]" id="showcase">
        <div className="max-w-7xl mx-auto relative">
          <div className="flex justify-center items-end gap-6 md:gap-12 flex-wrap lg:flex-nowrap">
            <div className="app-screen-mockup w-[260px] h-[520px] shrink-0 overflow-hidden transform -rotate-6 translate-y-12 hidden lg:block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/landing/screen-4.jpeg" className="w-full h-full object-cover" alt="Aether Welcome screen" />
            </div>
            <div className="app-screen-mockup w-[280px] h-[560px] shrink-0 overflow-hidden z-20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/landing/screen-3.jpeg" className="w-full h-full object-cover" alt="Aether Dashboard" />
            </div>
            <div className="app-screen-mockup w-[260px] h-[520px] shrink-0 overflow-hidden transform rotate-6 translate-y-12 hidden lg:block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/landing/screen-1.jpeg" className="w-full h-full object-cover" alt="Aether Progress screen" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 bg-white" id="features">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Advanced Tutoring Features</h2>
            <p className="text-[#555E61] max-w-2xl mx-auto">Built with the latest in neuro-educational research and large language models.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-[#FDFBF7] p-10 rounded-[40px] border border-[#EFEBE5] card-hover group">
              <div className="w-14 h-14 feature-icon rounded-2xl flex items-center justify-center mb-8">
                <UploadCloud size={28} />
              </div>
              <h3 className="text-2xl font-bold mb-4">Multi-Format Upload</h3>
              <p className="text-[#555E61] leading-relaxed">
                Upload PDFs, slides, textbooks, code, or even web links. Aether instantly ingests and indexes everything into your personal knowledge graph.
              </p>
            </div>
            <div className="bg-[#FDFBF7] p-10 rounded-[40px] border border-[#EFEBE5] card-hover">
              <div className="w-14 h-14 feature-icon rounded-2xl flex items-center justify-center mb-8">
                <Mic size={28} />
              </div>
              <h3 className="text-2xl font-bold mb-4">Voice Conversational</h3>
              <p className="text-[#555E61] leading-relaxed">
                Speak naturally to your AI tutor. Real-time voice interaction for questions, clarifications, and discussions. Fine-tune skills simultaneously.
              </p>
            </div>
            <div className="bg-[#FDFBF7] p-10 rounded-[40px] border border-[#EFEBE5] card-hover">
              <div className="w-14 h-14 feature-icon rounded-2xl flex items-center justify-center mb-8">
                <Map size={28} />
              </div>
              <h3 className="text-2xl font-bold mb-4">Visual Mind Palace</h3>
              <p className="text-[#555E61] leading-relaxed">
                Watch your knowledge grow as an interactive concept map. Aether dynamically builds connections between topics in real-time.
              </p>
            </div>
            <div className="bg-[#FDFBF7] p-10 rounded-[40px] border border-[#EFEBE5] card-hover">
              <div className="w-14 h-14 feature-icon rounded-2xl flex items-center justify-center mb-8">
                <Brain size={28} />
              </div>
              <h3 className="text-2xl font-bold mb-4">Infinite Context Memory</h3>
              <p className="text-[#555E61] leading-relaxed">
                Aether never forgets. Every concept you've learned, every question you've asked stays accessible. Pick up exactly where you left off.
              </p>
            </div>
            <div className="bg-[#FDFBF7] p-10 rounded-[40px] border border-[#EFEBE5] card-hover">
              <div className="w-14 h-14 feature-icon rounded-2xl flex items-center justify-center mb-8">
                <Users size={28} />
              </div>
              <h3 className="text-2xl font-bold mb-4">Global Community</h3>
              <p className="text-[#555E61] leading-relaxed">
                Compare mastery scores, share insights, and compete on leaderboards. Learn together with a global community of students using Aether.
              </p>
            </div>
            <div className="bg-[#FDFBF7] p-10 rounded-[40px] border border-[#EFEBE5] card-hover">
              <div className="w-14 h-14 feature-icon rounded-2xl flex items-center justify-center mb-8">
                <Zap size={28} />
              </div>
              <h3 className="text-2xl font-bold mb-4">Adaptive Learning Engine</h3>
              <p className="text-[#555E61] leading-relaxed">
                Real-time curriculum adjustment based on your mastery. Aether identifies weak spots and reinforces concepts at optimal intervals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Journey Section */}
      <section className="py-32 px-6 bg-[#FDFBF7]" id="journey">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-20">
            <div className="lg:w-1/3">
              <h2 className="text-5xl font-bold leading-tight mb-8">Your Learning Journey in 5 Steps</h2>
              <p className="text-lg text-[#555E61] mb-10">
                From your first upload to total mastery, Aether guides you through a proven learning loop designed for speed and retention.
              </p>
              <LandingAuthButton mode="signup" className="btn-primary px-10 py-5 rounded-3xl font-bold inline-flex items-center gap-3">
                Get Early Access
              </LandingAuthButton>
            </div>

            <div className="lg:w-2/3 space-y-6">
              <div className="bg-white p-8 rounded-[32px] border border-[#EFEBE5] flex gap-6 items-start">
                <span className="w-10 h-10 bg-[#6B8E61] text-white rounded-full flex items-center justify-center font-bold shrink-0">1</span>
                <div>
                  <h4 className="text-xl font-bold mb-2">Upload Your Material</h4>
                  <p className="text-[#555E61]">Drag and drop any material—PDFs, slides, code, or YouTube links. Aether processes it into a structured knowledge base.</p>
                </div>
              </div>
              <div className="bg-white p-8 rounded-[32px] border border-[#EFEBE5] flex gap-6 items-start">
                <span className="w-10 h-10 bg-[#6B8E61] text-white rounded-full flex items-center justify-center font-bold shrink-0">2</span>
                <div>
                  <h4 className="text-xl font-bold mb-2">AI Generates Your Curriculum</h4>
                  <p className="text-[#555E61]">Aether analyzes the material, creates a concept graph, and generates a personalized curriculum with prerequisite chains.</p>
                </div>
              </div>
              <div className="bg-white p-8 rounded-[32px] border border-[#EFEBE5] flex gap-6 items-start">
                <span className="w-10 h-10 bg-[#6B8E61] text-white rounded-full flex items-center justify-center font-bold shrink-0">3</span>
                <div>
                  <h4 className="text-xl font-bold mb-2">Conversational Tutoring</h4>
                  <p className="text-[#555E61]">Chat or speak naturally with your tutor. Ask questions, get Socratic guidance, and receive real-time feedback.</p>
                </div>
              </div>
              <div className="bg-white p-8 rounded-[32px] border border-[#EFEBE5] flex gap-6 items-start">
                <span className="w-10 h-10 bg-[#6B8E61] text-white rounded-full flex items-center justify-center font-bold shrink-0">4</span>
                <div>
                  <h4 className="text-xl font-bold mb-2">Mastery Assessment</h4>
                  <p className="text-[#555E61]">Adaptive quizzes and challenges target your weak areas. Aether uses space repetition to reinforce concepts.</p>
                </div>
              </div>
              <div className="bg-white p-8 rounded-[32px] border border-[#EFEBE5] flex gap-6 items-start">
                <span className="w-10 h-10 bg-[#6B8E61] text-white rounded-full flex items-center justify-center font-bold shrink-0">5</span>
                <div>
                  <h4 className="text-xl font-bold mb-2">Review &amp; Revisit</h4>
                  <p className="text-[#555E61]">At any time, revisit past concepts. Aether retrieves full context and re-adapts to close new knowledge gaps.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-32 px-6 bg-white" id="pricing">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold mb-6">Choose Your Path</h2>
            <p className="text-[#555E61]">Start free, upgrade when you outgrow it. No hidden fees, no surprises.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <div className="bg-[#FDFBF7] p-10 rounded-[48px] border border-[#EFEBE5] flex flex-col h-full">
              <h3 className="text-xl font-bold mb-2">Free</h3>
              <p className="text-[#555E61] text-sm mb-6">Dip your toes into personalized AI learning.</p>
              <div className="text-4xl font-bold mb-8">$0<span className="text-sm text-[#A0A5A8] font-normal">forever</span></div>
              <ul className="space-y-4 mb-10 flex-1">
                <li className="flex items-center gap-3 text-sm"><Check className="text-[#6B8E61]" size={18} /> 1 active learning session</li>
                <li className="flex items-center gap-3 text-sm"><Check className="text-[#6B8E61]" size={18} /> 10 AI chat messages / day</li>
                <li className="flex items-center gap-3 text-sm"><Check className="text-[#6B8E61]" size={18} /> 3 knowledge uploads total</li>
                <li className="flex items-center gap-3 text-sm"><Check className="text-[#6B8E61]" size={18} /> 2 quizzes / day</li>
                <li className="flex items-center gap-3 text-sm"><Check className="text-[#6B8E61]" size={18} /> 5 min voice tutor / day</li>
                <li className="flex items-center gap-3 text-sm"><Check className="text-[#6B8E61]" size={18} /> Basic progress tracking</li>
              </ul>
              <a href="#beta" className="w-full py-4 rounded-[24px] border border-[#EFEBE5] font-bold text-center hover:bg-[#F1E9DE] transition-all">Get Started</a>
            </div>
            <div className="bg-[#FDFBF7] p-10 rounded-[48px] pricing-card-featured flex flex-col h-full">
              <div className="inline-block px-4 py-1.5 bg-[#6B8E61] text-white text-[10px] font-bold uppercase tracking-widest rounded-full self-start mb-6">Most Popular</div>
              <h3 className="text-xl font-bold mb-2">Pro</h3>
              <p className="text-[#555E61] text-sm mb-6">For serious learners who want depth.</p>
              <div className="text-4xl font-bold mb-8">$12<span className="text-sm text-[#A0A5A8] font-normal">/month</span></div>
              <ul className="space-y-4 mb-10 flex-1">
                <li className="flex items-center gap-3 text-sm"><Check className="text-[#6B8E61]" size={18} /> 10 active sessions</li>
                <li className="flex items-center gap-3 text-sm"><Check className="text-[#6B8E61]" size={18} /> 200 AI messages / day</li>
                <li className="flex items-center gap-3 text-sm"><Check className="text-[#6B8E61]" size={18} /> 50 uploads / month</li>
                <li className="flex items-center gap-3 text-sm"><Check className="text-[#6B8E61]" size={18} /> Unlimited quizzes</li>
                <li className="flex items-center gap-3 text-sm"><Check className="text-[#6B8E61]" size={18} /> 60 min voice tutor / day</li>
                <li className="flex items-center gap-3 text-sm"><Check className="text-[#6B8E61]" size={18} /> AI Music Generation</li>
                <li className="flex items-center gap-3 text-sm"><Check className="text-[#6B8E61]" size={18} /> Full Analytics &amp; Mastery</li>
              </ul>
              <a href="#beta" className="w-full py-4 rounded-[24px] btn-primary font-bold text-center shadow-lg">Subscribe Now</a>
            </div>
            <div className="bg-[#FDFBF7] p-10 rounded-[48px] border border-[#EFEBE5] flex flex-col h-full">
              <h3 className="text-xl font-bold mb-2">Unlimited</h3>
              <p className="text-[#555E61] text-sm mb-6">Zero limits. For the power learners.</p>
              <div className="text-4xl font-bold mb-8">$29<span className="text-sm text-[#A0A5A8] font-normal">/month</span></div>
              <ul className="space-y-4 mb-10 flex-1">
                <li className="flex items-center gap-3 text-sm"><Check className="text-[#6B8E61]" size={18} /> Unlimited sessions</li>
                <li className="flex items-center gap-3 text-sm"><Check className="text-[#6B8E61]" size={18} /> Unlimited AI chat &amp; voice</li>
                <li className="flex items-center gap-3 text-sm"><Check className="text-[#6B8E61]" size={18} /> Unlimited uploads</li>
                <li className="flex items-center gap-3 text-sm"><Check className="text-[#6B8E61]" size={18} /> Priority AI model access</li>
                <li className="flex items-center gap-3 text-sm"><Check className="text-[#6B8E61]" size={18} /> Early access to features</li>
                <li className="flex items-center gap-3 text-sm"><Check className="text-[#6B8E61]" size={18} /> Priority 24/7 Support</li>
              </ul>
              <a href="#beta" className="w-full py-4 rounded-[24px] border border-[#EFEBE5] font-bold text-center hover:bg-[#F1E9DE] transition-all">Go Unlimited</a>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Screens Grid */}
      <section className="py-32 px-6 bg-[#FDFBF7] overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold">Beautiful Mobile Experience</h2>
            <p className="text-[#555E61] max-w-2xl mx-auto">
              Learn on the go with our fully featured Android app.
              <span className="font-bold text-[#6B8E61]"> Coming soon to Google Play &amp; Samsung Galaxy Store.</span>
            </p>
            <div className="flex items-center justify-center gap-3 mt-6">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#E8F1E6] text-[#6B8E61] text-xs font-bold">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M3.6 2.3 13 11.7l-9.4 9.4c-.5-.3-.8-1-.8-2.3V4.6c0-1.3.3-2 1.8-2.3zM16.8 8.4 13.7 5.3 4.6 14.4l3.1 3.1 9.1-9.1zM17.4 9l3.2-3.2c-.8-.6-1.9-.9-3.1-.9-.9 0-1.7.2-2.4.6L14 6.6l3.4 3.4zM4.6 1.8 14.2 11.4l1.6-1.6-9.4-9.4c-.6.3-1.4.9-2.3 1.4z"/></svg>
                Google Play — Coming Soon
              </span>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F1E9DE] text-[#A8763E] text-xs font-bold">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 2 4 7v10l8 5 8-5V7l-8-5zm0 2.3 6 3.75v7.9l-6 3.75-6-3.75v-7.9l6-3.75z"/></svg>
                Galaxy Store — Coming Soon
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            <div className="rounded-3xl border-4 border-white shadow-lg overflow-hidden card-hover">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/landing/screen-1.jpeg" className="w-full" alt="Progress" />
            </div>
            <div className="rounded-3xl border-4 border-white shadow-lg overflow-hidden card-hover lg:translate-y-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/landing/screen-2.jpeg" className="w-full" alt="Dashboard" />
            </div>
            <div className="rounded-3xl border-4 border-white shadow-lg overflow-hidden card-hover lg:translate-y-16">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/landing/screen-3.jpeg" className="w-full" alt="Sessions" />
            </div>
            <div className="rounded-3xl border-4 border-white shadow-lg overflow-hidden card-hover lg:translate-y-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/landing/screen-4.jpeg" className="w-full" alt="Welcome" />
            </div>
            <div className="rounded-3xl border-4 border-white shadow-lg overflow-hidden card-hover">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/landing/screen-5.jpeg" className="w-full" alt="Roadmap" />
            </div>
          </div>
        </div>
      </section>

      {/* Beta Signup Section */}
      <section className="py-32 px-6" id="beta">
        <div className="max-w-4xl mx-auto bg-white rounded-[64px] p-12 md:p-20 text-center border border-[#EFEBE5] shadow-2xl relative overflow-hidden">
          <div className="absolute top-10 right-10 flex items-center gap-2 px-4 py-1.5 bg-[#E8F1E6] rounded-full border border-[#6B8E61]/20">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-[#6B8E61] uppercase tracking-widest">Status: Accepting Signups</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-8">Get Early Access</h2>
          <p className="text-lg text-[#555E61] mb-12">We're onboarding in waves. Drop your email and we'll let you know when your slot opens.</p>
          <BetaSignupForm />
          <div className="mt-12 text-[#EFEBE5] text-[60px] md:text-[80px] font-black tracking-tighter opacity-20 pointer-events-none uppercase">Aether Closed Beta</div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 bg-[#2D3436] text-white text-center px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl md:text-6xl font-bold mb-8">Ready to Supercharge Your Learning?</h2>
          <p className="text-xl text-gray-400 leading-relaxed mb-12">Join thousands of students who have transformed the way they learn. One conversation with Aether and you'll never study the same way again.</p>
          <LandingAuthButton mode="signup" className="btn-primary px-12 py-6 rounded-[32px] text-xl font-bold inline-flex items-center gap-4">
            Join the Revolution
            <Zap className="text-white" size={22} />
          </LandingAuthButton>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-[#EFEBE5] text-center">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-8">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/landing/logo.png" alt="Aether" className="w-8 h-8 rounded-lg object-cover shadow-sm" />
              <span className="text-[#2D3436] font-bold text-xl tracking-tight uppercase">Aether</span>
            </div>
            <div className="flex items-center gap-8">
              <a href="#" className="text-sm text-[#555E61] hover:text-[#6B8E61]">Terms</a>
              <a href="#" className="text-sm text-[#555E61] hover:text-[#6B8E61]">Privacy</a>
              <a href="#" className="text-sm text-[#555E61] hover:text-[#6B8E61]">Community</a>
            </div>
          </div>
          <p className="text-sm text-[#A0A5A8]">© 2026 Aether Learning. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
