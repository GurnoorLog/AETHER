import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type UsageType = "chat" | "quiz" | "voice" | "challenge";

type Tier = "free" | "pro" | "unlimited";

const LIMITS: Record<Tier, Record<UsageType, number>> = {
  free: { chat: 10, quiz: 2, voice: 5, challenge: 0 },
  pro: { chat: 200, quiz: Infinity, voice: 60, challenge: Infinity },
  unlimited: { chat: Infinity, quiz: Infinity, voice: Infinity, challenge: Infinity },
};

async function getUserTier(userId: string): Promise<Tier> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("user_profiles")
    .select("subscription_tier")
    .eq("user_id", userId)
    .maybeSingle();
  const tier = (data as { subscription_tier?: string } | null)?.subscription_tier;
  return tier === "pro" || tier === "unlimited" ? tier : "free";
}

async function resetIfStaleDay(userId: string, admin: ReturnType<typeof createAdminClient>): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await admin
    .from("user_usage")
    .select("updated_at")
    .eq("user_id", userId)
    .maybeSingle();
  const updated = (data as { updated_at?: string } | null)?.updated_at;
  if (updated && updated.slice(0, 10) !== today) {
    await admin
      .from("user_usage")
      .update({ chat_count: 0, quiz_count: 0, voice_count: 0, challenge_count: 0, updated_at: new Date().toISOString() })
      .eq("user_id", userId);
  }
}

export async function checkUsage(userId: string, type: UsageType): Promise<{ allowed: boolean; remaining: number }> {
  const [tier, supabase] = await Promise.all([getUserTier(userId), createServerSupabaseClient()]);

  await resetIfStaleDay(userId, createAdminClient());

  const { data } = await supabase
    .from("user_usage")
    .select("chat_count, quiz_count, voice_count, challenge_count")
    .eq("user_id", userId)
    .maybeSingle();

  const count = (data as Record<string, number> | null)?.[`${type}_count`] ?? 0;
  const limit = LIMITS[tier][type];
  return { allowed: count < limit, remaining: Math.max(0, limit - count) };
}

export async function incrementUsage(userId: string, type: UsageType): Promise<void> {
  const admin = createAdminClient();
  await resetIfStaleDay(userId, admin);
  await admin.rpc("increment_usage", { p_user_id: userId, p_column: `${type}_count` });
}

export async function incrementTokens(userId: string, tokens: number): Promise<void> {
  if (!tokens || tokens <= 0) return;
  const admin = createAdminClient();
  await admin.rpc("increment_tokens", { p_user_id: userId, p_tokens: tokens });
}

export const USAGE_LIMITS = LIMITS;

const UPLOAD_LIMITS: Record<Tier, number> = { free: 3, pro: 50, unlimited: Infinity };

export async function checkUploadQuota(userId: string): Promise<{ allowed: boolean; remaining: number }> {
  const [tier, supabase] = await Promise.all([getUserTier(userId), createServerSupabaseClient()]);
  const { count } = await supabase
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  const limit = UPLOAD_LIMITS[tier];
  const used = count ?? 0;
  return { allowed: used < limit, remaining: Math.max(0, limit - used) };
}