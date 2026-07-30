import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { checkUsage, incrementUsage } from "@/lib/usage";

export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const usage = await checkUsage(user.id, "voice");
  if (!usage.allowed) {
    return NextResponse.json({ error: "Voice tutor limit reached. You have used all 10 voice sessions. Contact support to increase your limit." }, { status: 429 });
  }

  const { text } = await req.json();
  if (!text || typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }
  const key = process.env.DEEPGRAM_API_KEY;
  if (!key) return NextResponse.json({ error: "no key" }, { status: 500 });

  const res = await fetch("https://api.deepgram.com/v1/speak?model=aura-asteria-en&encoding=mp3", {
    method: "POST",
    headers: {
      Authorization: `Token ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err }, { status: 500 });
  }

  await incrementUsage(user.id, "voice");

  return new NextResponse(res.body, {
    headers: { "Content-Type": "audio/mpeg" },
  });
}
