import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const key = process.env.DEEPGRAM_API_KEY;
  if (!key) return Response.json({ error: "Not configured" }, { status: 500 });

  const { text } = await req.json();
  if (!text) return Response.json({ error: "Missing text" }, { status: 400 });

  const url = "https://api.deepgram.com/v1/speak?model=aura-2-odysseus-en";

  try {
    const dgRes = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Token ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (!dgRes.ok) return Response.json({ error: "TTS failed" }, { status: dgRes.status });

    const audio = await dgRes.arrayBuffer();
    return new Response(audio, {
      headers: { "Content-Type": "audio/mpeg" },
    });
  } catch {
    return Response.json({ error: "TTS failed" }, { status: 500 });
  }
}
