"use client";

import { useAuthModal } from "@/hooks/useAuthModal";
import { useAuth } from "@/providers/AuthProvider";

export default function Nav() {
  const { open } = useAuthModal();
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-[100] w-full px-12 py-10 flex justify-center">
      <nav className="w-full max-w-7xl glass-card rounded-full px-12 py-6 flex items-center justify-between shadow-2xl backdrop-blur-3xl">
        <a href="#" className="flex items-center gap-4 group">
          <div className="w-14 h-14 bg-black rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 premium-transition">
            <svg className="text-cyber-yellow text-3xl w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
            </svg>
          </div>
          <span className="text-2xl font-black text-black lg:text-white lg:mix-blend-difference tracking-tighter">AETHER</span>
        </a>

        <div className="hidden md:flex gap-16">
          <a href="#" className="text-sm font-bold text-white/60 hover:text-cyber-yellow premium-transition">Platform</a>
          <a href="#methodology" className="text-sm font-bold text-white/60 hover:text-cyber-yellow premium-transition">Methodology</a>
          <a href="#" className="text-sm font-bold text-white/60 hover:text-cyber-yellow premium-transition">Research</a>
        </div>

        <div className="flex items-center gap-6">
          {user ? (
            <a
              href="/dashboard"
              className="px-10 py-4 bg-cyber-yellow text-black rounded-full font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-xl shadow-cyber-yellow/10"
            >
              Dashboard
            </a>
          ) : (
            <>
              <button
                onClick={() => open("login")}
                className="text-sm font-bold text-white/40 border border-white/10 px-8 py-3 rounded-full hover:border-cyber-yellow/40 hover:text-white premium-transition cursor-pointer"
              >
                Login
              </button>
              <button
                onClick={() => open("signup")}
                className="px-10 py-4 bg-cyber-yellow text-black rounded-full font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-xl shadow-cyber-yellow/10 cursor-pointer"
              >
                Start Learning
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
