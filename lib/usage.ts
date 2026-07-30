import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const LIMITS = { chat: 10, quiz: 10, voice: 10 } as const;
type UsageType = keyof typeof LIMITS;

export async function checkUsage(userId: string, type: UsageType): Promise<{ allowed: boolean; remaining: number }> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("user_usage")
    .select("chat_count, quiz_count, voice_count")
    .eq("user_id", userId)
    .maybeSingle();

  const count = (data as Record<string, number>)?.[`${type}_count`] ?? 0;
  const limit = LIMITS[type];
  return { allowed: count < limit, remaining: Math.max(0, limit - count) };
}

export async function incrementUsage(userId: string, type: UsageType): Promise<void> {
  const admin = createAdminClient();
  await admin.rpc("increment_usage", { p_user_id: userId, p_column: `${type}_count` });
}
