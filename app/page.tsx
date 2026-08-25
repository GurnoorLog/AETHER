import type { Metadata } from "next";
import {
  Sparkles,
  ArrowRight,
  Smartphone,
  UploadCloud,
  Mic,
  Map,
  Brain,
  Users,
  Zap,
  Check,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Aether AI | Everything You Need to Learn Faster",
  description:
    "Neural language models adapt to your unique learning style, creating a personalized educational experience that evolves with you.",
};

export default function Home() {
  return (
    <div className="min-h-screen relative bg-[#FDFBF7] text-[#2D3436] font-sans overflow-x-hidden">
      <div className="gradient-blur" />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#FDFBF7]/80 backdrop-blur-md border-b border-[#EFEBE5]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#6B8E61] rounded-xl flex items-center justify-center">
              <Sparkles className="text-white" size={20} />
            </div>
            <span className="text-[#2D3436] font-bold text-2xl tracking-tight uppercase">Aether</span>
          </div>
          <div className="hidden md:flex items-center gap-10">
            <a href="#features" className="text-sm font-semibold hover:text-[#6B8E61] transition-colors">Features</a>
            <a href="#journey" className="text-sm font-semibold hover:text-[#6B8E61] transition-colors">Journey</a>
            <a href="#pricing" className="text-sm font-semibold hover:text-[#6B8E61] transition-colors">Pricing</a>
            <a href="#showcase" className="text-sm font-semibold hover:text-[#6B8E61] transition-colors">Mobile App</a>
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="text-sm font-semibold text-[#2D3436] px-6 py-2.5 rounded-2xl hover:bg-[#F1E9DE] transition-all">Login</a>
            <a href="#beta" className="btn-primary text-sm font-bold px-8 py-3 rounded-2xl">Get Started</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 hero-bg min-h-[90vh] flex items-center">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#E8F1E6]/90 backdrop-blur-sm text-[#6B8E61] rounded-full text-xs font-bold tracking-widest uppercase mb-8 shadow-sm">
            <Sparkles className="text-[#6B8E61]" size={16} />
            Powered by Adaptive Neural Models
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-[84px] font-bold tracking-tight leading-[1.05] text-[#2D3436] mb-8">
            Everything You Need to <br />
            <span className="text-[#6B8E61]">Learn Faster</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-[#2D3436] font-medium leading-relaxed mb-12">
            Neural language models adapt to your unique learning style, creating a personalized educational experience that evolves with you.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#beta" className="btn-primary w-full sm:w-auto px-10 py-5 rounded-3xl text-lg font-bold flex items-center justify-center gap-3 shadow-lg">
              Start Learning Free
              <ArrowRight className="text-white" size={20} />
            </a>
            <a href="#showcase" className="w-full sm:w-auto px-10 py-5 rounded-3xl text-lg font-bold bg-white/90 backdrop-blur-sm border border-[#EFEBE5] hover:border-[#6B8E61] transition-all flex items-center justify-center gap-3 shadow-lg">
              View Mobile App
              <Smartphone className="text-[#6B8E61]" size={20} />
            </a>
          </div>
        </div>
      </section>

      {/* App Preview Floating */}
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
              <a href="#beta" className="btn-primary px-10 py-5 rounded-3xl font-bold inline-flex items-center gap-3">
                Get Early Access
              </a>
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
            <p className="text-[#555E61]">Learn on the go with our fully featured Android and iOS apps.</p>
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
          <div className="flex flex-col md:flex-row gap-4 max-w-lg mx-auto mb-6">
            <input type="email" placeholder="Enter your email address" className="flex-1 px-8 py-5 rounded-3xl bg-[#FDFBF7] border border-[#EFEBE5] focus:outline-none focus:border-[#6B8E61] text-lg" />
            <button className="btn-primary px-10 py-5 rounded-3xl font-bold text-lg whitespace-nowrap">Subscribe</button>
          </div>
          <p className="text-sm text-[#A0A5A8] font-medium">No spam, ever. Your privacy is our priority.</p>
          <div className="mt-12 text-[#EFEBE5] text-[60px] md:text-[80px] font-black tracking-tighter opacity-20 pointer-events-none uppercase">Aether Closed Beta</div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 bg-[#2D3436] text-white text-center px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl md:text-6xl font-bold mb-8">Ready to Supercharge Your Learning?</h2>
          <p className="text-xl text-gray-400 leading-relaxed mb-12">Join thousands of students who have transformed the way they learn. One conversation with Aether and you'll never study the same way again.</p>
          <a href="#beta" className="btn-primary px-12 py-6 rounded-[32px] text-xl font-bold inline-flex items-center gap-4">
            Join the Revolution
            <Zap className="text-white" size={22} />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-[#EFEBE5] text-center">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#6B8E61] rounded-lg flex items-center justify-center">
                <Sparkles className="text-white" size={18} />
              </div>
              <span className="text-[#2D3436] font-bold text-xl tracking-tight uppercase">Aether</span>
            </div>
            <div className="flex items-center gap-8">
              <a href="#" className="text-sm text-[#555E61] hover:text-[#6B8E61]">Terms</a>
              <a href="#" className="text-sm text-[#555E61] hover:text-[#6B8E61]">Privacy</a>
              <a href="#" className="text-sm text-[#555E61] hover:text-[#6B8E61]">Community</a>
            </div>
          </div>
          <p className="text-sm text-[#A0A5A8]">© 2024 Aether Learning. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
