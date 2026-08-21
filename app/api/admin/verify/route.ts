import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { signAdminToken, isLockedOut, logAudit, clientIp, verifyTotp } from "@/lib/admin-server";

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !user.email || !isAdminEmail(user.email)) {
    return NextResponse.json({ ok: false, error: "Not authorized" }, { status: 403 });
  }

  const ip = clientIp(request);
  const { locked, retryAfterSec } = await isLockedOut(user.email, ip);
  if (locked) {
    return NextResponse.json(
      { ok: false, error: `Too many attempts. Try again in ${Math.ceil(retryAfterSec / 60)} min.` },
      { status: 429 }
    );
  }

  const body = await request.json();
  const provided = String(body.code || "").trim();

  if (!verifyTotp(process.env.ADMIN_TOTP_SECRET || "", provided)) {
    await logAudit(user.email, "verify_failed", request);
    return NextResponse.json({ ok: false, error: "Invalid code" }, { status: 401 });
  }

  const token = signAdminToken(user.id, user.email);
  await logAudit(user.email, "verify_success", request);

  return NextResponse.json({ ok: true, token, expires_in_hours: 6 });
}
