"use client";

import { useState, type FormEvent } from "react";
import AuthInput from "./AuthInput";
import { resetPassword } from "@/lib/auth";
import type { AuthView } from "@/types/database";

interface ForgotPasswordFormProps {
  onSwitchView: (view: AuthView) => void;
}

export default function ForgotPasswordForm({ onSwitchView }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [sent, setSent] = useState(false);

  const validate = () => {
    if (!email) {
      setEmailError("Email is required");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Invalid email address");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setEmailError("");

    if (!validate()) return;

    setLoading(true);

    const result = await resetPassword(email);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="text-center space-y-8 py-8">
        <div className="w-20 h-20 rounded-3xl bg-cyber-yellow/20 flex items-center justify-center mx-auto">
          <svg className="w-10 h-10 text-cyber-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        </div>
        <div>
          <h3 className="text-2xl font-black text-white mb-3">Check Your Email</h3>
          <p className="text-white/50 text-sm font-medium">
            We&apos;ve sent a password reset link to <span className="text-white/80">{email}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => onSwitchView("login")}
          className="text-sm font-bold text-cyber-yellow hover:text-cyber-yellow/80 premium-transition cursor-pointer"
        >
          Back to Sign In
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <p className="text-white/50 text-sm font-medium leading-relaxed">
        Enter the email address associated with your account and we&apos;ll send you a link to reset your password.
      </p>

      <AuthInput
        id="forgot-email"
        label="Email"
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={emailError}
        autoComplete="email"
      />

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
          <p className="text-[11px] font-bold text-red-400 uppercase tracking-wider text-center">
            {error}
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-5 bg-cyber-yellow text-black rounded-2xl font-black text-sm
          hover:scale-[1.02] active:scale-[0.98] premium-transition shadow-xl shadow-cyber-yellow/10
          disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-3">
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Sending...
          </span>
        ) : (
          "Send Reset Link"
        )}
      </button>

      <p className="text-center text-[11px] font-bold uppercase tracking-wider text-white/30">
        Remember your password?{" "}
        <button
          type="button"
          onClick={() => onSwitchView("login")}
          className="text-cyber-yellow hover:text-cyber-yellow/80 premium-transition cursor-pointer"
        >
          Sign in
        </button>
      </p>
    </form>
  );
}
