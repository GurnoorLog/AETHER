import { NextResponse } from "next/server";

export async function POST() {
  const key = process.env.DEEPGRAM_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "DEEPGRAM_API_KEY not configured" }, { status: 500 });
  }
  return new NextResponse(key, {
    headers: { "Content-Type": "text/plain" },
  });
}

export async function GET() {
  return POST();
}
