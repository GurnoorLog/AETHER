"use client";

import type { InputHTMLAttributes } from "react";

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export default function AuthInput({
  label,
  error,
  id,
  className = "",
  ...props
}: AuthInputProps) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="block text-[11px] font-black uppercase tracking-[0.2em] text-white/40"
      >
        {label}
      </label>
      <input
        id={id}
        className={`w-full px-5 py-4 bg-white/5 border ${
          error ? "border-red-500/50" : "border-white/10"
        } rounded-2xl text-white placeholder:text-white/20 text-sm font-medium
        focus:outline-none focus:border-cyber-yellow/60 focus:ring-1 focus:ring-cyber-yellow/20
        premium-transition ${className}`}
        {...props}
      />
      {error && (
        <p className="text-[11px] font-bold text-red-400 uppercase tracking-wider">
          {error}
        </p>
      )}
    </div>
  );
}
