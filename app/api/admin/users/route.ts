import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin";
import { verifyAdminToken, logAudit } from "@/lib/admin-server";

interface UsageRow {
  user_id: string;
  chat_count: number;
  quiz_count: number;
  voice_count: number;
  challenge_count: number;
  tokens_used: number;
}

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const token = request.headers.get("x-admin-token") || "";
  const verified = verifyAdminToken(token);
  if (!verified || verified.userId !== user.id) {
    await logAudit(user.email, "token_rejected", request);
    return NextResponse.json({ error: "Session expired. Re-authenticate." }, { status: 401 });
  }

  await logAudit(user.email, "data_access", request);

  const admin = createAdminClient();

  const { data: authUsers, error: authErr } = await admin.auth.admin.listUsers();
  if (authErr || !authUsers) {
    return NextResponse.json({ error: "Failed to load users" }, { status: 500 });
  }

  const { data: usageRows } = await admin.from("user_usage").select("*");
  const { data: betaRows } = await admin.from("beta_requests").select("email, approved, created_at");
  const { data: profileRows } = await admin
    .from("user_profiles")
    .select("user_id, full_name, email");

  const usageByUser = new Map((usageRows as UsageRow[] | null)?.map((u) => [u.user_id, u]) ?? []);
  const betaByEmail = new Map((betaRows ?? []).map((b) => [b.email.toLowerCase(), b]));
  const profileByUser = new Map((profileRows ?? []).map((p) => [p.user_id, p]));

  const users = authUsers.users.map((u) => {
    const usage = usageByUser.get(u.id);
    const beta = betaByEmail.get((u.email || "").toLowerCase());
    const profile = profileByUser.get(u.id);
    return {
      id: u.id,
      email: u.email,
      full_name: profile?.full_name || u.user_metadata?.full_name || null,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      beta_approved: beta?.approved ?? false,
      beta_requested: beta ? new Date(beta.created_at) : null,
      usage: {
        chat_count: usage?.chat_count ?? 0,
        quiz_count: usage?.quiz_count ?? 0,
        voice_count: usage?.voice_count ?? 0,
        challenge_count: usage?.challenge_count ?? 0,
        tokens_used: usage?.tokens_used ?? 0,
      },
    };
  });

  const totals = users.reduce(
    (acc, u) => {
      acc.tokens += u.usage.tokens_used;
      acc.chats += u.usage.chat_count;
      acc.quizzes += u.usage.quiz_count;
      acc.voice += u.usage.voice_count;
      acc.challenges += u.usage.challenge_count;
      acc.approved += u.beta_approved ? 1 : 0;
      return acc;
    },
    { tokens: 0, chats: 0, quizzes: 0, voice: 0, challenges: 0, approved: 0 }
  );

  users.sort((a, b) => (b.usage.tokens_used + b.usage.chat_count) - (a.usage.tokens_used + a.usage.chat_count));

  const { data: auditRows } = await admin
    .from("admin_audit")
    .select("email, action, ip, created_at")
    .order("created_at", { ascending: false })
    .limit(25);

  return NextResponse.json({
    users,
    totals,
    audit: auditRows ?? [],
    stats: {
      total_users: users.length,
      total_tokens: totals.tokens,
      total_chats: totals.chats,
      total_quizzes: totals.quizzes,
      total_voice: totals.voice,
      total_challenges: totals.challenges,
      total_approved: totals.approved,
    },
  });
}
