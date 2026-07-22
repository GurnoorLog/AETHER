"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/providers/AuthProvider";
import { AuthModalProvider } from "@/hooks/useAuthModal";
import { PlayerProvider } from "@/providers/PlayerProvider";
import AuthModal from "@/components/auth/AuthModal";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <PlayerProvider>
        <AuthModalProvider>
          {children}
          <AuthModal />
        </AuthModalProvider>
      </PlayerProvider>
    </AuthProvider>
  );
}
