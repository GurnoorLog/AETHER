import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { text } = await req.json();
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

  return new NextResponse(res.body, {
    headers: { "Content-Type": "audio/mpeg" },
  });
}
