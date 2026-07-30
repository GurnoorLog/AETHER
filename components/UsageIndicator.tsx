"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";

const LIMITS = { chat: 10, quiz: 10, voice: 10, challenge: 10 } as const;

export function UsageIndicator() {
  const { user } = useAuth();
  const [usage, setUsage] = useState<{ chat: number; quiz: number; voice: number; challenge: number } | null>(null);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase.from("user_usage").select("chat_count, quiz_count, voice_count, challenge_count").eq("user_id", user.id).maybeSingle().then(
      ({ data }) => {
        if (data) setUsage({ chat: data.chat_count, quiz: data.quiz_count, voice: data.voice_count, challenge: data.challenge_count });
      }
    );
  }, [user]);

  if (!usage) return null;

  const items = [
    { label: "Chat", used: usage.chat, limit: LIMITS.chat },
    { label: "Quizzes", used: usage.quiz, limit: LIMITS.quiz },
    { label: "Voice", used: usage.voice, limit: LIMITS.voice },
    { label: "Challenges", used: usage.challenge, limit: LIMITS.challenge },
  ];

  return (
    <div className="flex items-center gap-4 text-[10px] font-bold tracking-widest text-white/40">
      {items.map((item) => (
        <span key={item.label} className={item.used >= item.limit ? "text-red-400" : ""}>
          {item.label}: {item.used}/{item.limit}
        </span>
      ))}
    </div>
  );
}
