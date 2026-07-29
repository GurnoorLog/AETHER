import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const urlStr = request.nextUrl.searchParams.get("url");
  if (!urlStr) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  let url: URL;
  try {
    url = new URL(urlStr);
    if (!["http:", "https:"].includes(url.protocol)) {
      return new NextResponse("Invalid protocol", { status: 400 });
    }
  } catch {
    return new NextResponse("Invalid URL", { status: 400 });
  }

  const audioRes = await fetch(url.toString());
  if (!audioRes.ok) {
    return new NextResponse("Failed to fetch audio", { status: audioRes.status });
  }

  const blob = await audioRes.blob();
  return new NextResponse(blob, {
    headers: {
      "Content-Type": audioRes.headers.get("Content-Type") || "audio/wav",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
