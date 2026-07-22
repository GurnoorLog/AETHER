import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  const audioRes = await fetch(url);
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
