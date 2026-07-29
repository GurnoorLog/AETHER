import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(req: NextRequest) {
  const { subject, topic, language = "python" } = await req.json();
  if (!GEMINI_API_KEY) return NextResponse.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });

  const prompt = `You are a coding challenge generator. Generate a coding challenge for a student learning "${subject}" about "${topic}".

Return a JSON object with:
- "id": a short kebab-case id (e.g. "python-loop-challenge")
- "title": short challenge name
- "description": 2-3 sentence description of the problem
- "difficulty": "easy", "medium", or "hard"
- "language": "${language}"
- "starterCode": starter code template for the user
- "solution": a working solution
- "testCases": array of { "input": string, "expected": string } objects

Return ONLY the JSON object, no markdown, no explanation.`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
        }),
      },
    );
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const cleaned = text.replace(/```(?:json)?\s*/g, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: "Failed to parse challenge" }, { status: 500 });

    const challenge = JSON.parse(jsonMatch[0]);
    return NextResponse.json(challenge);
  } catch {
    return NextResponse.json({ error: "Failed to generate challenge" }, { status: 500 });
  }
}
