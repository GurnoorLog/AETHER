import { NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

/**
 * POST /api/music/enhance-prompt
 *
 * Server-side Gemini call to enhance a user's music description into
 * a richer prompt + short lyrics. Keeps the API key off the client.
 */
export async function POST(request: Request) {
  try {
    const { userText, mood, instrument } = await request.json();

    if (!userText || !mood || !instrument) {
      return NextResponse.json(
        { error: "userText, mood, and instrument are required" },
        { status: 400 }
      );
    }

    const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You are a music generation assistant. The user wants a focus/study track.
Mood: ${mood}
Instrument: ${instrument}
User's description: "${userText}"

Generate lyrics (a short verse, 2-4 lines) and a rich prompt.
Return JSON: { "lyrics": "...", "enhanced_prompt": "..." }.
Keep lyrics under 80 characters. Enhanced prompt: 1-2 sentences describing the musical vibe.`,
              },
            ],
          },
        ],
        generationConfig: { temperature: 0.9, maxOutputTokens: 200 },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Gemini error:", errText);
      return NextResponse.json(
        { error: `Gemini API error: ${res.status}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const cleaned = text
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();

    return NextResponse.json(JSON.parse(cleaned));
  } catch (error) {
    console.error("Enhance prompt error:", error);
    return NextResponse.json(
      { error: `Failed: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
