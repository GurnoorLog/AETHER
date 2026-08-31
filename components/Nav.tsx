"use client";

import { useState } from "react";
import { useAuthModal } from "@/hooks/useAuthModal";
import { useAuth } from "@/providers/AuthProvider";

export default function Nav() {
  const { open } = useAuthModal();
  const { user } = useAuth();
  const [mOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-[100] w-full px-3 sm:px-6 lg:px-12 py-4 sm:py-6 lg:py-10 flex justify-center">
      <nav className="w-full max-w-7xl rounded-full px-4 sm:px-6 lg:px-12 py-4 lg:py-5 flex items-center justify-between bg-[#FDFBF7]/90 backdrop-blur-xl border border-[#E7E1D6]">
        <a href="#" className="flex items-center gap-2 sm:gap-3 group">
          <span className="text-xl sm:text-2xl font-bold tracking-tight text-[#2D3436] serif-display">Aether</span>
        </a>

        <div className="hidden md:flex gap-12">
          <a href="#" className="text-sm font-bold text-[#2D3436]/60 hover:text-[#3F5C3A] ease-smooth">Platform</a>
          <a href="#methodology" className="text-sm font-bold text-[#2D3436]/60 hover:text-[#3F5C3A] ease-smooth">Methodology</a>
          <a href="/pricing" className="text-sm font-bold text-[#2D3436]/60 hover:text-[#3F5C3A] ease-smooth">Pricing</a>
          <a href="#" className="text-sm font-bold text-[#2D3436]/60 hover:text-[#3F5C3A] ease-smooth">Research</a>
        </div>

        <div className="hidden md:flex items-center gap-5">
          {user ? (
            <a
              href="/dashboard"
              className="px-7 lg:px-9 py-3 btn-editorial rounded-full font-black text-sm hover:scale-105 active:scale-95 transition-all btn-hard"
            >
              Dashboard
            </a>
          ) : (
            <>
              <button
                onClick={() => open("login")}
                className="text-sm font-bold text-[#2D3436]/60 border border-[#E7E1D6] px-6 lg:px-8 py-2.5 lg:py-3 rounded-full hover:border-[#3F5C3A]/40 hover:text-[#3F5C3A] ease-smooth cursor-pointer"
              >
                Login
              </button>
              <button
                onClick={() => open("signup")}
                className="px-7 lg:px-9 py-3 btn-editorial rounded-full font-black text-sm hover:scale-105 active:scale-95 transition-all btn-hard cursor-pointer"
              >
                Start Learning
              </button>
            </>
          )}
        </div>

        <button
          onClick={() => setMobileOpen(!mOpen)}
          className="md:hidden w-10 h-10 rounded-full bg-white border border-[#E7E1D6] flex items-center justify-center hover:bg-[#E9EDE3] transition-all cursor-pointer"
          aria-label="Toggle menu"
        >
          <svg className="w-5 h-5 text-[#2D3436]/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            {mOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            )}
          </svg>
        </button>
      </nav>

      {mOpen && (
        <div className="md:hidden fixed inset-x-0 top-[4.5rem] mx-3 sm:mx-6 z-[99]">
          <div className="rounded-3xl p-6 shadow-2xl bg-[#FDFBF7] border border-[#E7E1D6] flex flex-col gap-4 editorial">
            <a href="#" onClick={() => setMobileOpen(false)} className="text-sm font-bold text-[#2D3436]/80 hover:text-[#3F5C3A] py-3 px-4 rounded-2xl hover:bg-[#E9EDE3]/60 transition-all editorial">Platform</a>
            <a href="#methodology" onClick={() => setMobileOpen(false)} className="text-sm font-bold text-[#2D3436]/80 hover:text-[#3F5C3A] py-3 px-4 rounded-2xl hover:bg-[#E9EDE3]/60 transition-all editorial">Methodology</a>
            <a href="/pricing" onClick={() => setMobileOpen(false)} className="text-sm font-bold text-[#2D3436]/80 hover:text-[#3F5C3A] py-3 px-4 rounded-2xl hover:bg-[#E9EDE3]/60 transition-all editorial">Pricing</a>
            <a href="#" onClick={() => setMobileOpen(false)} className="text-sm font-bold text-[#2D3436]/80 hover:text-[#3F5C3A] py-3 px-4 rounded-2xl hover:bg-[#E9EDE3]/60 transition-all editorial">Research</a>
            <hr className="border-[#E7E1D6] my-2" />
            {user ? (
              <a
                href="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="text-center py-4 btn-editorial rounded-full font-black text-sm hover:scale-[1.02] active:scale-95 transition-all btn-hard"
              >
                Dashboard
              </a>
            ) : (
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => { open("login"); setMobileOpen(false); }}
                  className="text-sm font-bold text-[#2D3436]/60 border border-[#E7E1D6] py-4 rounded-full hover:border-[#3F5C3A]/40 hover:text-[#3F5C3A] ease-smooth cursor-pointer"
                >
                  Login
                </button>
                <button
                  onClick={() => { open("signup"); setMobileOpen(false); }}
                  className="py-4 btn-editorial rounded-full font-black text-sm hover:scale-[1.02] active:scale-95 transition-all btn-hard cursor-pointer"
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