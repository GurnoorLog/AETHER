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
    return NextResponse.json({ error: "Voice tutor limit reached for today. Upgrade for more voice time." }, { status: 429 });
  }

  const key = process.env.DEEPGRAM_API_KEY;
  if (!key) return NextResponse.json({ error: "no key" }, { status: 500 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File) || !file.size) {
    return NextResponse.json({ error: "audio is required" }, { status: 400 });
  }

  const audio = await file.arrayBuffer();
  const contentType = file.type || "audio/mp4";

  const res = await fetch(
    "https://api.deepgram.com/v1/listen?model=nova-2-general&smart_format=true&punctuate=true&language=en",
    {
      method: "POST",
      headers: {
        Authorization: `Token ${key}`,
        "Content-Type": contentType,
      },
      body: audio,
    },
  );

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err }, { status: 500 });
  }

  const json = await res.json();
  const transcript = json?.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? "";
  if (!transcript) {
    return NextResponse.json({ error: "No speech detected" }, { status: 422 });
  }

  await incrementUsage(user.id, "voice");

  return NextResponse.json({ transcript });
}
