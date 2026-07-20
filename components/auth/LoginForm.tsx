"use client";

import { useState, type FormEvent } from "react";
import AuthInput from "./AuthInput";
import PasswordInput from "./PasswordInput";
import SocialLogin from "./SocialLogin";
import { signIn } from "@/lib/auth";
import { useAuth } from "@/providers/AuthProvider";
import { useAuthModal } from "@/hooks/useAuthModal";
import type { AuthView } from "@/types/database";

interface LoginFormProps {
  onSwitchView: (view: AuthView) => void;
  onSuccess?: () => void;
}

export default function LoginForm({ onSwitchView, onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const { refresh } = useAuth();
  const { close } = useAuthModal();

  const validate = () => {
    let valid = true;
    setEmailError("");
    setPasswordError("");

    if (!email) {
      setEmailError("Email is required");
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Invalid email address");
      valid = false;
    }

    if (!password) {
      setPasswordError("Password is required");
      valid = false;
    }

    return valid;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validate()) return;

    setLoading(true);

    const result = await signIn({ email, password });

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    await refresh();
    close();
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <AuthInput
        id="login-email"
        label="Email"
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={emailError}
        autoComplete="email"
      />

      <div className="space-y-2">
        <PasswordInput
          id="login-password"
          label="Password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={passwordError}
          autoComplete="current-password"
        />
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => onSwitchView("forgot_password")}
            className="text-[11px] font-bold text-cyber-yellow/60 hover:text-cyber-yellow premium-transition cursor-pointer"
          >
            Forgot Password?
          </button>
        </div>
      </div>

      <label className="flex items-center gap-3 cursor-pointer group">
        <div
          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center premium-transition ${
            remember
              ? "bg-cyber-yellow border-cyber-yellow"
              : "border-white/20 group-hover:border-white/40"
          }`}
          onClick={() => setRemember(!remember)}
        >
          {remember && (
            <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          )}
        </div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-white/40 group-hover:text-white/60 premium-transition">
          Remember me
        </span>
      </label>

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
            Signing In...
          </span>
        ) : (
          "Sign In"
        )}
      </button>

      <SocialLogin />

      <p className="text-center text-[11px] font-bold uppercase tracking-wider text-white/30">
        Don&apos;t have an account?{" "}
        <button
          type="button"
          onClick={() => onSwitchView("signup")}
          className="text-cyber-yellow hover:text-cyber-yellow/80 premium-transition cursor-pointer"
        >
          Create one
        </button>
      </p>
    </form>
  );
}
