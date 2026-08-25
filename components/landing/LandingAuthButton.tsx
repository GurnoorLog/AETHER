"use client";

import { useAuthModal } from "@/hooks/useAuthModal";
import { useAuth } from "@/providers/AuthProvider";
import type { ReactNode } from "react";

export default function LandingAuthButton({
  mode = "signup",
  className,
  children,
}: {
  mode?: "login" | "signup";
  className?: string;
  children: ReactNode;
}) {
  const { open } = useAuthModal();
  const { user } = useAuth();

  if (user) {
    return (
      <a href="/dashboard" className={className}>
        {children}
      </a>
    );
  }

  return (
    <button type="button" onClick={() => open(mode)} className={className}>
      {children}
    </button>
  );
}
