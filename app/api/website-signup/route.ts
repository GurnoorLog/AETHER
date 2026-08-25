import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: Request) {
  const { email: raw, source } = await req.json();
  if (!raw || typeof raw !== "string") {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const email = raw.toLowerCase().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("website_signups")
    .select("email")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ ok: true, already: true });
  }

  const { error } = await supabase
    .from("website_signups")
    .insert({ email, source: typeof source === "string" ? source : "landing" });

  if (error) {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
