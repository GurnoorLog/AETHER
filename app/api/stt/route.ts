import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const key = process.env.DEEPGRAM_API_KEY;
  if (!key) return Response.json({ error: "Not configured" }, { status: 500 });

  const audio = await req.arrayBuffer();
  const contentType = req.headers.get("content-type") || "audio/webm";
  const url = "https://api.deepgram.com/v1/listen?model=nova-2&language=en&interim_results=false&endpointing=500&utterance_end_ms=1000";

  try {
    const dgRes = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Token ${key}`,
        "Content-Type": contentType,
      },
      body: audio,
    });

    const data = await dgRes.json();
    const transcript = data?.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";
    return Response.json({ transcript });
  } catch {
    return Response.json({ error: "STT failed" }, { status: 500 });
  }
}
