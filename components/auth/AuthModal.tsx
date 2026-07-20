"use client";

import { useEffect, useRef } from "react";
import { useAuthModal } from "@/hooks/useAuthModal";
import LoginForm from "./LoginForm";
import SignUpForm from "./SignUpForm";
import ForgotPasswordForm from "./ForgotPasswordForm";

export default function AuthModal() {
  const { isOpen, view, close, switchView } = useAuthModal();
  const overlayRef = useRef<HTMLDivElement>(null);

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
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    if (isOpen) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, close]);

  if (!isOpen) return null;

  const titles: Record<string, { heading: string; sub: string }> = {
    login: { heading: "Welcome Back", sub: "Sign in to continue your learning journey" },
    signup: { heading: "Create Account", sub: "Start your personalized learning experience" },
    forgot_password: { heading: "Reset Password", sub: "We'll send you a recovery link" },
  };

  const { heading, sub } = titles[view];

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8"
      onClick={(e) => {
        if (e.target === overlayRef.current) close();
      }}
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        style={{ animation: "fadeIn 0.3s cubic-bezier(0.22, 1, 0.36, 1)" }}
      />

      <div
        className="relative w-full max-w-[440px] glass-card rounded-[40px] p-10 sm:p-14 shadow-[0_80px_160px_-40px_rgba(0,0,0,0.8)] border-white/20 overflow-y-auto max-h-[90vh]"
        style={{ animation: "modalSlideUp 0.5s cubic-bezier(0.22, 1, 0.36, 1)" }}
      >
        <button
          type="button"
          onClick={close}
          className="absolute top-6 right-6 w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center
            hover:bg-white/10 hover:border-white/20 premium-transition group cursor-pointer"
        >
          <svg
            className="w-4 h-4 text-white/40 group-hover:text-white premium-transition"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 rounded-2xl bg-cyber-yellow flex items-center justify-center shadow-xl">
            <svg className="w-6 h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <span className="text-xl font-black tracking-tighter text-white">AETHER</span>
        </div>

        <div className="mb-10">
          <h2 className="text-3xl font-black text-white mb-3">{heading}</h2>
          <p className="text-white/40 text-sm font-medium">{sub}</p>
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

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(40px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
