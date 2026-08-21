"use client";

import { useState } from "react";
import { useAuthModal } from "@/hooks/useAuthModal";
import { useAuth } from "@/providers/AuthProvider";

export default function Nav() {
  const { open } = useAuthModal();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-[100] w-full px-3 sm:px-6 lg:px-12 py-4 sm:py-6 lg:py-10 flex justify-center">
      <nav className="w-full max-w-7xl glass-card rounded-full px-4 sm:px-6 lg:px-12 py-4 lg:py-6 flex items-center justify-between shadow-2xl backdrop-blur-3xl">
        <a href="#" className="flex items-center gap-2 sm:gap-4 group">
          <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-black rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 premium-transition">
            <svg className="text-cyber-yellow text-xl sm:text-2xl lg:text-3xl w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
            </svg>
          </div>
          <span className="text-xl sm:text-2xl font-black text-black lg:text-white lg:mix-blend-difference tracking-tighter">AETHER</span>
        </a>

        <div className="hidden md:flex gap-16">
          <a href="#" className="text-sm font-bold text-white/60 hover:text-cyber-yellow premium-transition">Platform</a>
          <a href="#methodology" className="text-sm font-bold text-white/60 hover:text-cyber-yellow premium-transition">Methodology</a>
          <a href="/pricing" className="text-sm font-bold text-white/60 hover:text-cyber-yellow premium-transition">Pricing</a>
          <a href="#" className="text-sm font-bold text-white/60 hover:text-cyber-yellow premium-transition">Research</a>
        </div>

        <div className="hidden md:flex items-center gap-6">
          {user ? (
            <a
              href="/dashboard"
              className="px-8 lg:px-10 py-3 lg:py-4 bg-cyber-yellow text-black rounded-full font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-xl shadow-cyber-yellow/10"
            >
              Dashboard
            </a>
          ) : (
            <>
              <button
                onClick={() => open("login")}
                className="text-sm font-bold text-white/40 border border-white/10 px-6 lg:px-8 py-2 lg:py-3 rounded-full hover:border-cyber-yellow/40 hover:text-white premium-transition cursor-pointer"
              >
                Login
              </button>
              <button
                onClick={() => open("signup")}
                className="px-8 lg:px-10 py-3 lg:py-4 bg-cyber-yellow text-black rounded-full font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-xl shadow-cyber-yellow/10 cursor-pointer"
              >
                Start Learning
              </button>
            </>
          )}
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all cursor-pointer"
          aria-label="Toggle menu"
        >
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            )}
          </svg>
        </button>
      </nav>

      {mobileOpen && (
        <div className="md:hidden fixed inset-x-0 top-[4.5rem] mx-3 sm:mx-6 z-[99]">
          <div className="glass-card rounded-3xl p-6 shadow-2xl backdrop-blur-3xl border border-white/10 flex flex-col gap-4">
            <a href="#" onClick={() => setMobileOpen(false)} className="text-sm font-bold text-white/80 hover:text-cyber-yellow py-3 px-4 rounded-2xl hover:bg-white/5 transition-all">Platform</a>
            <a href="#methodology" onClick={() => setMobileOpen(false)} className="text-sm font-bold text-white/80 hover:text-cyber-yellow py-3 px-4 rounded-2xl hover:bg-white/5 transition-all">Methodology</a>
            <a href="/pricing" onClick={() => setMobileOpen(false)} className="text-sm font-bold text-white/80 hover:text-cyber-yellow py-3 px-4 rounded-2xl hover:bg-white/5 transition-all">Pricing</a>
            <a href="#" onClick={() => setMobileOpen(false)} className="text-sm font-bold text-white/80 hover:text-cyber-yellow py-3 px-4 rounded-2xl hover:bg-white/5 transition-all">Research</a>
            <hr className="border-white/10 my-2" />
            {user ? (
              <a
                href="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="text-center py-4 bg-cyber-yellow text-black rounded-full font-black text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-cyber-yellow/10"
              >
                Dashboard
              </a>
            ) : (
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => { open("login"); setMobileOpen(false); }}
                  className="text-sm font-bold text-white/40 border border-white/10 py-4 rounded-full hover:border-cyber-yellow/40 hover:text-white premium-transition cursor-pointer"
                >
                  Login
                </button>
                <button
                  onClick={() => { open("signup"); setMobileOpen(false); }}
                  className="py-4 bg-cyber-yellow text-black rounded-full font-black text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-cyber-yellow/10 cursor-pointer"
                >
                  Start Learning
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
