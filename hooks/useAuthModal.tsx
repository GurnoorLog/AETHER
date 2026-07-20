"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { AuthView } from "@/types/database";

interface AuthModalContextValue {
  isOpen: boolean;
  view: AuthView;
  open: (view?: AuthView) => void;
  close: () => void;
  switchView: (view: AuthView) => void;
}

const AuthModalContext = createContext<AuthModalContextValue>({
  isOpen: false,
  view: "login",
  open: () => {},
  close: () => {},
  switchView: () => {},
});

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<AuthView>("login");

  const open = useCallback((initialView?: AuthView) => {
    if (initialView) setView(initialView);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const switchView = useCallback((newView: AuthView) => {
    setView(newView);
  }, []);

  return (
    <AuthModalContext.Provider value={{ isOpen, view, open, close, switchView }}>
      {children}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  return useContext(AuthModalContext);
}
