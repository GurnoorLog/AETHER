"use client";

import { useAuthModal } from "@/hooks/useAuthModal";
import { useAuth } from "@/providers/AuthProvider";
import { useRouter } from "next/navigation";

export default function CtaSection() {
  const { open } = useAuthModal();
  const { user } = useAuth();
  const router = useRouter();

  return (
    <section className="relative px-12 md:px-24 py-48 overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyber-yellow/5 rounded-full blur-[200px] pointer-events-none" />

      <div className="relative max-w-4xl mx-auto text-center z-10 flex flex-col items-center">
        <div className="inline-flex items-center gap-4 px-8 py-5 bg-white/5 border border-white/10 rounded-full mb-16">
          <div className="w-3 h-3 rounded-full bg-cyber-yellow animate-pulse" />
          <span className="text-sm font-bold text-cyber-yellow uppercase tracking-[0.15em]">
            Limited Early Access — Join 2,847+ Learners
          </span>
        </div>

        <h2 className="text-6xl md:text-8xl font-black text-white leading-[0.9] tracking-tight mb-12">
          Ready to <span className="text-cyber-yellow radical-glow">Supercharge</span> Your Learning?
        </h2>

        <p className="text-2xl text-white/30 font-bold max-w-2xl mb-16 leading-relaxed">
          Join thousands of students who have transformed the way they learn. One conversation with Aether and you&apos;ll never study the same way again.
        </p>

        <div className="flex flex-col sm:flex-row gap-8 items-center">
          <button
            onClick={() => (user ? router.push("/dashboard") : open("signup"))}
            className="px-16 py-8 bg-cyber-yellow text-black rounded-full font-black text-2xl hover:scale-110 active:scale-95 transition-all shadow-[0_30px_80px_-12px_rgba(253,224,71,0.4)] glitter-button cursor-pointer"
          >
            {user ? "Go to Dashboard" : "Start Learning Free"}
          </button>
          <button
            onClick={() => open("login")}
            className="px-16 py-8 text-white/40 border border-white/10 rounded-full font-black text-2xl hover:text-white hover:border-white/30 premium-transition cursor-pointer"
          >
            Sign In
          </button>
        </div>

        <div className="mt-20 flex items-center gap-8 text-white/20 font-bold text-sm">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            No credit card required
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Cancel anytime
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Free updates forever
          </div>
        </div>
      </div>
    </section>
  );
}
