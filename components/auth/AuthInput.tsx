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
        className="block text-[11px] font-black uppercase tracking-[0.2em] text-[#555E61]"
      >
        {label}
      </label>
      <input
        id={id}
        className={`w-full px-5 py-4 bg-white border ${
          error ? "border-red-500/60" : "border-[#EFEBE5]"
        } rounded-2xl text-[#2D3436] placeholder:text-[#A0A5A8] text-sm font-medium
        focus:outline-none focus:border-[#6B8E61]/60 focus:ring-1 focus:ring-[#6B8E61]/20
        premium-transition ${className}`}
        {...props}
      />
      {error && (
        <p className="text-[11px] font-bold text-red-500 uppercase tracking-wider">
          {error}
        </p>
      )}
    </div>
  );
}
