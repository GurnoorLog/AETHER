"use client";

import { createContext, useContext, useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";

interface Session {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  subject: string | null;
  objectives: string | null;
  created_at: string;
  updated_at: string;
}

interface SessionContextType {
  session: Session | null;
  loading: boolean;
}

const SessionContext = createContext<SessionContextType>({ session: null, loading: true });

export function useSession() {
  return useContext(SessionContext);
}

export default function SessionLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ session: string }>;
}) {
  const resolvedParams = use(params);
  const slug = resolvedParams.session;
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSession = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("sessions")
      .select("*")
      .eq("slug", slug)
      .eq("user_id", user.id)
      .single();
    if (data) {
      setSession(data as Session);
    } else {
      router.replace("/hub");
    }
    setLoading(false);
  }, [user, slug, router]);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) fetchSession();
  }, [user, fetchSession]);

  if (authLoading || loading) {
    return (
      <div className="h-screen bg-deep-onyx text-white flex overflow-hidden">
        <div className="w-[15%] shrink-0 p-6 space-y-4">
          <div className="animate-pulse bg-white/5 rounded-2xl w-10 h-10" />
          <div className="animate-pulse bg-white/5 rounded-full h-10" />
        </div>
        <main className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-cyber-yellow border-t-transparent rounded-full animate-spin" />
        </main>
        <div className="w-[20%] shrink-0 p-6">
          <div className="animate-pulse bg-white/5 rounded-[32px] h-64" />
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <SessionContext.Provider value={{ session, loading }}>
      {children}
    </SessionContext.Provider>
  );
}
