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
        className={`editorial-input w-full px-5 py-4 text-sm font-medium ${
          error ? "border-red-500" : ""
        } ${className}`}
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
