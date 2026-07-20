"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/providers/AuthProvider";
import { AuthModalProvider } from "@/hooks/useAuthModal";
import AuthModal from "@/components/auth/AuthModal";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AuthModalProvider>
        {children}
        <AuthModal />
      </AuthModalProvider>
    </AuthProvider>
  );
}
