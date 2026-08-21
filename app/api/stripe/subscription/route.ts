import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("subscription_tier, subscription_status, current_period_end")
    .eq("user_id", user.id)
    .single();

  return NextResponse.json({
    tier: profile?.subscription_tier ?? "free",
    status: profile?.subscription_status ?? null,
    currentPeriodEnd: profile?.current_period_end ?? null,
  });
}
