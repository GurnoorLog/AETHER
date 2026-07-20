"use client";

import { useAuthModal } from "@/hooks/useAuthModal";
import { useAuth } from "@/providers/AuthProvider";

export default function Nav() {
  const { open } = useAuthModal();
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-[100] w-full px-12 py-10 flex justify-center">
      <nav className="w-full max-w-7xl glass-card rounded-full px-12 py-6 flex items-center justify-between shadow-2xl backdrop-blur-3xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyber-yellow/[0.02] via-transparent to-cyber-yellow/[0.02] pointer-events-none" />
        <a href="#" className="flex items-center gap-4 group">
          <div className="w-14 h-14 bg-black rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(253,224,71,0.3)] premium-transition">
            <svg className="text-cyber-yellow text-3xl w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <span className="text-2xl font-black text-black lg:text-white lg:mix-blend-difference tracking-tighter">AETHER</span>
        </a>

        <div className="hidden md:flex gap-16">
          {["Platform", "Methodology", "Research"].map((item) => (
            <a
              key={item}
              href={item === "Methodology" ? "#methodology" : "#"}
              className="text-sm font-bold text-white/60 hover:text-cyber-yellow premium-transition relative after:absolute after:bottom-[-4px] after:left-1/2 after:-translate-x-1/2 after:w-0 after:h-[2px] after:bg-cyber-yellow after:rounded-full hover:after:w-full after:premium-transition"
            >
              {item}
            </a>
          ))}
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
                className="text-sm font-bold text-white/40 border border-white/10 px-8 py-3 rounded-full hover:border-cyber-yellow/40 hover:text-white premium-transition cursor-pointer hover:bg-white/[0.02]"
              >
                Login
              </button>
              <button
                onClick={() => open("signup")}
                className="px-10 py-4 bg-cyber-yellow text-black rounded-full font-black text-sm hover:scale-105 hover:shadow-[0_0_40px_rgba(253,224,71,0.3)] active:scale-95 transition-all shadow-xl shadow-cyber-yellow/10 cursor-pointer relative overflow-hidden group"
              >
                <span className="relative z-10">Start Learning</span>
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 premium-transition" />
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
