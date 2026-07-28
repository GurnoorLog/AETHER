import { NextResponse } from "next/server";

export async function POST() {
  const key = process.env.DEEPGRAM_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "DEEPGRAM_API_KEY not configured" }, { status: 500 });
  }

  try {
    const res = await fetch("https://api.deepgram.com/v1/auth/grant", {
      method: "POST",
      headers: {
        "Authorization": `Token ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ scopes: ["agent"], time_to_live: 3600 }),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: text }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json({ token: data.token });
  } catch (err) {
    return NextResponse.json({ error: "Failed to grant token" }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}
