import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { email: raw } = await req.json();
  if (!raw || typeof raw !== "string") {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const email = raw.toLowerCase().trim();
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("beta_requests")
    .select("approved")
    .eq("email", email)
    .maybeSingle();

  if (existing?.approved) {
    return NextResponse.json({ error: "already_approved" });
  }
  if (existing) {
    return NextResponse.json({ error: "already_requested" });
  }

  const { error } = await admin.from("beta_requests").insert({ email });
  if (error) {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
