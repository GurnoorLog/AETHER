import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { configureRevenueCat, identifyUser } from '@/lib/revenuecat';
import type { Session } from '@supabase/supabase-js';

export const SITE_URL = 'https://aether-sooty-one.vercel.app';

const AuthContext = createContext<{ session: Session | null }>({ session: null });
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    configureRevenueCat();
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user?.id) identifyUser(data.session.user.id);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s?.user?.id) identifyUser(s.user.id);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  if (loading) return null;
  return <AuthContext.Provider value={{ session }}>{children}</AuthContext.Provider>;
}
