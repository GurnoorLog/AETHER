import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { totpIssuerUri } from "@/lib/admin-server";

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !user.email || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const secret = process.env.ADMIN_TOTP_SECRET || "";
  if (!secret) {
    return NextResponse.json({ error: "TOTP secret not configured" }, { status: 500 });
  }

  return NextResponse.json({ secret, uri: totpIssuerUri(secret, user.email) });
}