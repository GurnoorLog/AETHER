"use client";

import { createContext, useContext, useEffect, useState, useCallback, use } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { PanelRightOpen } from "lucide-react";
import SidebarRight from "@/components/SidebarRight";
import SidebarLeft from "@/components/SidebarLeft";

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
  const pathname = usePathname();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const isVoiceTutor = pathname?.includes("/voice-tutor") || pathname?.includes("/challenges") || pathname?.includes("/challenge-code") || pathname?.includes("/challenge-math");

  const currentPage = (() => {
    const segments = pathname?.split("/").filter(Boolean) ?? [];
    const page = segments[1] || "dashboard";
    if (page === "dashboard") return "home";
    if (page === "chat") return "tutor";
    return page;
  })();

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
      <div className="h-screen bg-[#FDFBF7] text-[#2D3436] flex max-lg:flex-col max-lg:w-full overflow-hidden">
        <div className="w-[15%] shrink-0 p-6 space-y-4 max-lg:hidden">
          <div className="animate-pulse bg-warm-ink/[0.04] rounded-2xl w-10 h-10" />
          <div className="animate-pulse bg-warm-ink/[0.04] rounded-full h-10" />
        </div>
        <main className="flex-1 flex items-center justify-center max-lg:p-3 md:max-lg:p-4">
          <div className="w-6 h-6 border-2 border-sage/40 border-t-sage rounded-full animate-spin" />
        </main>
        <div className="w-[20%] shrink-0 p-6 max-lg:hidden">
          <div className="animate-pulse bg-white/60 rounded-[32px] h-64" />
        </div>
      </div>
    );
  }

  if (!session) return null;

  if (isVoiceTutor) {
    return (
      <SessionContext.Provider value={{ session, loading }}>
        {children}
      </SessionContext.Provider>
    );
  }

  return (
    <SessionContext.Provider value={{ session, loading }}>
      <div className="h-screen bg-[#FDFBF7] text-[#2D3436] flex max-lg:flex-col max-lg:w-full overflow-hidden">
        <SidebarLeft currentPage={currentPage} />
        <div className="flex-1 flex flex-col relative z-0 min-w-0 h-screen overflow-hidden">
          {children}
          <button
            type="button"
            aria-label="Toggle details panel"
            className="lg:hidden fixed bottom-20 right-4 z-50 w-10 h-10 bg-white border border-hairline-warm rounded-xl flex items-center justify-center text-warm-ink-muted hover:text-warm-ink transition-all shadow-sm cursor-pointer"
            onClick={() => window.dispatchEvent(new CustomEvent("toggle-mobile-sidebar"))}
          >
            <PanelRightOpen className="w-4 h-4" />
          </button>
        </div>
        <SidebarRight />
      </div>
    </SessionContext.Provider>
  );
}
