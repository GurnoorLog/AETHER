"use client";

import { useEffect, useRef } from "react";
import { useAuthModal } from "@/hooks/useAuthModal";
import LoginForm from "./LoginForm";
import SignUpForm from "./SignUpForm";
import ForgotPasswordForm from "./ForgotPasswordForm";

export default function AuthModal() {
  const { isOpen, view, close, switchView } = useAuthModal();
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    if (isOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  if (!isOpen) return null;

  const copy: Record<string, { heading: string; sub: string }> = {
    login: { heading: "Welcome Back", sub: "Sign in to continue your learning journey" },
    signup: { heading: "Create Account", sub: "Start your personalized learning experience" },
    forgot_password: { heading: "Reset Password", sub: "We'll send you a recovery link" },
  };

  const { heading, sub } = copy[view];

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8"
      onClick={(e) => {
        if (e.target === overlayRef.current) close();
      }}
    >
      <div
        className="absolute inset-0 bg-[#2D3436]/40 backdrop-blur-sm editorial"
        style={{ animation: "fadeIn 0.3s cubic-bezier(0.22, 1, 0.36, 1)" }}
      />

      <div
        ref={panelRef}
        className="relative w-full max-w-[920px] flex rounded-[40px] overflow-hidden shadow-[0_40px_120px_-30px_rgba(45,52,54,0.35)] editorial"
        style={{ animation: "modalSlideUp 0.5s cubic-bezier(0.16, 1, 0.24, 1)" }}
      >
        <div className="hidden md:flex flex-1 bg-gradient-to-br from-[#3F5C3A] via-[#4C6B47] to-[#5E7D6B] p-10 flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <span className="text-lg font-black tracking-tighter text-white">Aether</span>
            </div>

            <h3 className="text-2xl font-black text-white mb-4 leading-tight">
              Your personal AI tutor that never forgets.
            </h3>
            <ul className="space-y-3">
              {[
                "Upload any learning material",
                "Adaptive voice conversations",
                "Personalized knowledge graphs",
                "Mastery-based progression",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-white/80">
                  <svg className="w-4 h-4 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative z-10 flex items-center gap-4 p-5 rounded-3xl bg-white/10 border border-white/20 backdrop-blur-xl editorial">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center editorial">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-black text-white">AI Assistant</p>
              <p className="text-xs text-white/70">Ready to help you learn</p>
            </div>
            <div className="ml-auto flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            </div>
          </div>
        </div>
        <div className="w-full md:w-[440px] bg-[#FDFBF7] p-6 sm:p-8 lg:p-12 overflow-y-auto max-h-[90vh] editorial">
          <button
            type="button"
            onClick={close}
            className="absolute top-5 right-5 w-9 h-9 rounded-2xl bg-[#EFEBE5] border border-[#EFEBE5] flex items-center justify-center
              hover:bg-[#E9EDE3] hover:border-[#3F5C3A]/30 premium-transition group cursor-pointer editorial"
          >
            <svg
              className="w-3.5 h-3.5 text-[#2D3436]/50 group-hover:text-[#2D3436] premium-transition"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="mb-8">
            <h2 className="text-2xl lg:text-3xl font-black text-[#2D3436] mb-2">{heading}</h2>
            <p className="text-[#555E61] text-sm font-medium">{sub}</p>
          </div>

          {view === "login" && (
            <LoginForm onSwitchView={switchView} />
          )}
          {view === "signup" && (
            <SignUpForm onSwitchView={switchView} />
          )}
          {view === "forgot_password" && (
            <ForgotPasswordForm onSwitchView={switchView} />
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(30px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}