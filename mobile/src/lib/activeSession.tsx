import { createContext, useContext, useState, type ReactNode } from 'react';

export interface ActiveSession {
  id: string;
  slug: string;
  title: string;
  subject: string | null;
}

const ActiveSessionContext = createContext<{
  session: ActiveSession | null;
  setSession: (s: ActiveSession | null) => void;
}>({
  session: null,
  setSession: () => {},
});

export function ActiveSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<ActiveSession | null>(null);
  return (
    <ActiveSessionContext.Provider value={{ session, setSession }}>
      {children}
    </ActiveSessionContext.Provider>
  );
}

export const useActiveSession = () => useContext(ActiveSessionContext);
