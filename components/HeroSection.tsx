"use client";

import { useAuthModal } from "@/hooks/useAuthModal";
import { useAuth } from "@/providers/AuthProvider";
import { useRouter } from "next/navigation";

export default function HeroSection() {
  const { open } = useAuthModal();
  const { user } = useAuth();
  const router = useRouter();

  return (
    <section className="liquid-hero pt-12 px-12 md:px-24 pb-64 shadow-[0_50px_120px_rgba(0,0,0,0.4)] relative overflow-hidden">
      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="particle-float absolute w-2 h-2 rounded-full bg-black/20"
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + (i % 3) * 20}%`,
              animationDelay: `${i * 0.8}s`,
              animationDuration: `${5 + i * 0.7}s`,
              width: `${4 + (i % 2) * 4}px`,
              height: `${4 + (i % 2) * 4}px`,
            }}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center relative z-10">
        <div>
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-black/5 border border-black/10 rounded-full mb-10">
            <svg className="text-black w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
            <span className="text-xs font-black uppercase tracking-[0.2em] text-black">The Future of Cognition</span>
          </div>

          <h1 className="text-7xl md:text-[8rem] font-black text-black leading-[0.8] tracking-tighter mb-12">
            Meet Your <br /> AI Tutor That <br />
            <span className="relative">
              Never Forgets.
              <svg className="absolute -bottom-4 left-0 w-full" height="12" viewBox="0 0 600 12" fill="none">
                <path d="M4 8C150 2 450 2 596 8" stroke="black" strokeWidth="8" strokeLinecap="round" />
              </svg>
            </span>
          </h1>

          <p className="text-2xl md:text-3xl text-black/80 font-medium max-w-xl mb-16 leading-tight">
            Upload anything&mdash;notes, slides, or entire textbooks. Experience a human-like conversational journey that adapts to your learning pace in real-time.
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-10">
            <button
              onClick={() => (user ? router.push("/dashboard") : open("signup"))}
              className="px-14 py-8 bg-black text-white rounded-full font-black text-2xl hover:scale-110 active:scale-95 transition-all shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] glow-pulse-yellow cursor-pointer"
            >
              {user ? "Go to Dashboard" : "Get Started Free"}
            </button>
            <button className="flex items-center gap-5 text-2xl font-black text-black hover:opacity-60 premium-transition group cursor-pointer">
              <span className="w-16 h-16 rounded-full border-2 border-black/10 flex items-center justify-center group-hover:bg-black group-hover:text-white premium-transition">
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                </svg>
              </span>
              Watch Demo
            </button>
          </div>
        </div>

        <div className="relative hidden lg:block">
          <div className="glass-card p-2 rounded-[56px] overflow-hidden rotate-1 shadow-[0_80px_160px_-40px_rgba(0,0,0,0.7)] bg-white/5 border-white/20 scale-105">
            <div className="bg-[#0A0A0A] rounded-[48px] overflow-hidden p-8 aspect-[4/3] flex flex-col gap-6">
              <div className="flex items-center justify-between pb-6 border-b border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-cyber-yellow flex items-center justify-center">
                    <svg className="text-black w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-black text-white">Aether AI</p>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <p className="text-[11px] text-white/40 uppercase font-bold tracking-widest">Speaking to Sarah</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-end gap-1.5 h-10 px-4">
                  <div className="waveform-bar bg-cyber-yellow w-1 rounded-full" style={{ animationDuration: '0.6s' }} />
                  <div className="waveform-bar bg-cyan-400 w-1 rounded-full" style={{ animationDuration: '1.2s' }} />
                  <div className="waveform-bar bg-cyber-yellow w-1 rounded-full" style={{ animationDuration: '0.8s' }} />
                  <div className="waveform-bar bg-white/60 w-1 rounded-full" style={{ animationDuration: '1.4s' }} />
                  <div className="waveform-bar bg-cyber-yellow w-1 rounded-full" style={{ animationDuration: '0.9s' }} />
                </div>
              </div>

              <div className="flex-1 space-y-6 overflow-y-auto pr-2">
                <div className="flex justify-end gap-3">
                  <div className="bg-white/5 border border-white/10 p-5 rounded-3xl rounded-tr-none max-w-[80%] shadow-lg">
                    <p className="text-sm text-white/80">&ldquo;I&apos;m struggling to visualize how the curvature of spacetime actually causes gravity. Can you use an analogy?&rdquo;</p>
                    <p className="text-[10px] text-white/30 font-bold mt-2 uppercase">11:42 AM</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                    <svg className="w-full h-full text-white/40" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-5.523 0-10 2.015-10 4.5v1.5c0 .552.448 1 1 1h18c.552 0 1-.448 1-1v-1.5c0-2.485-4.477-4.5-10-4.5z" />
                    </svg>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-cyber-yellow flex items-center justify-center shrink-0">
                    <svg className="text-black w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                  </div>
                  <div className="bg-white/10 border border-white/20 p-5 rounded-3xl rounded-tl-none max-w-[85%] shadow-2xl">
                    <p className="text-sm text-white/90 leading-relaxed">
                      &ldquo;Think of a trampoline. When you place a bowling ball in the center, the fabric stretches down. That&apos;s a mass warping spacetime.&rdquo;
                    </p>
                    <div className="mt-4 p-3 bg-black/40 rounded-xl border border-white/10 flex items-center gap-3">
                      <svg className="w-4 h-4 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                      <span className="text-[10px] font-bold text-white/60 uppercase tracking-tight">Ref: Relativity_Lec_04.pdf</span>
                    </div>
                    <p className="text-[10px] text-white/30 font-bold mt-2 uppercase">11:43 AM</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 opacity-60">
                  <div className="w-10 h-10 rounded-full bg-cyber-yellow/20 flex items-center justify-center shrink-0">
                    <svg className="text-cyber-yellow w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                  </div>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-white rounded-full typing-dot" style={{ animationDelay: '0s' }} />
                    <div className="w-2 h-2 bg-white rounded-full typing-dot" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 bg-white rounded-full typing-dot" style={{ animationDelay: '0.4s' }} />
                  </div>
                  <span className="text-xs font-bold text-white/40 italic">Aether is thinking</span>
                  <span className="text-white/60 font-black cursor-blink">|</span>
                </div>
              </div>

              <div className="mt-auto grid grid-cols-2 gap-6">
                <div className="bg-white/5 p-5 rounded-[32px] border border-white/10 flex flex-col gap-3 shadow-xl">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-black text-white/40 uppercase tracking-widest">Concept Mastery</span>
                    <span className="text-sm font-black text-cyber-yellow">92%</span>
                  </div>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-cyber-yellow w-[92%] rounded-full shadow-[0_0_15px_rgba(253,224,71,0.5)]" />
                  </div>
                </div>
                <div className="bg-cyber-yellow p-5 rounded-[32px] flex items-center justify-between group cursor-pointer hover:scale-105 premium-transition shadow-2xl">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black text-black uppercase tracking-wider">Adaptive Quiz</span>
                    <span className="text-[11px] font-bold text-black/60">5 Questions Ready</span>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-cyber-yellow">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute -left-16 top-1/2 animate-float">
            <div className="glass-card p-6 rounded-[32px] w-56 shadow-[0_50px_100px_rgba(0,0,0,0.5)] border-white/20 shimmer">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 bg-blue-500/20 rounded-2xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-black text-white uppercase tracking-tight">Knowledge Graph</p>
                  <p className="text-[10px] font-bold text-blue-400 uppercase">Updated</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-cyber-yellow animate-pulse" />
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em]">Syncing Context...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
