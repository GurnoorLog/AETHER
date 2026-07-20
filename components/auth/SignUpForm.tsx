"use client";

import { useState, type FormEvent } from "react";
import AuthInput from "./AuthInput";
import PasswordInput from "./PasswordInput";
import SocialLogin from "./SocialLogin";
import { signUp } from "@/lib/auth";
import { useAuth } from "@/providers/AuthProvider";
import { useAuthModal } from "@/hooks/useAuthModal";
import type { AuthView } from "@/types/database";

interface SignUpFormProps {
  onSwitchView: (view: AuthView) => void;
  onSuccess?: () => void;
}

export default function SignUpForm({ onSwitchView, onSuccess }: SignUpFormProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const { refresh } = useAuth();
  const { close } = useAuthModal();

  const validate = () => {
    let valid = true;
    setNameError("");
    setEmailError("");
    setPasswordError("");

    if (!fullName.trim()) {
      setNameError("Full name is required");
      valid = false;
    }

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
    } else if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      valid = false;
    } else if (!/[A-Z]/.test(password)) {
      setPasswordError("Password must contain an uppercase letter");
      valid = false;
    }

    return valid;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validate()) return;

    setLoading(true);

    const result = await signUp({ email, password, fullName });

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
    <form onSubmit={handleSubmit} className="space-y-5">
      <AuthInput
        id="signup-name"
        label="Full Name"
        type="text"
        placeholder="Sarah Johnson"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        error={nameError}
        autoComplete="name"
      />

      <AuthInput
        id="signup-email"
        label="Email"
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={emailError}
        autoComplete="email"
      />

      <PasswordInput
        id="signup-password"
        label="Password"
        placeholder="Min. 8 characters"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={passwordError}
        autoComplete="new-password"
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
            Creating Account...
          </span>
        ) : (
          "Create Account"
        )}
      </button>

      <SocialLogin />

      <p className="text-center text-[11px] font-bold uppercase tracking-wider text-white/30">
        Already have an account?{" "}
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
