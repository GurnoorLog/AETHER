import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(req: NextRequest) {
  const { subject, mode, difficulty, duration, objectives } = await req.json();

  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "Missing GEMINI_API_KEY" },
      { status: 500 }
    );
  }

  const prompt = `You are an AI learning path designer. Generate a structured learning roadmap for the subject "${subject}".

Configuration:
- Learning Mode: ${mode}
- Difficulty: ${difficulty}
- Session Duration: ${duration}
- Objectives: ${objectives || "General mastery of the subject"}

Return a JSON array of 4-6 modules. Each module must have:
- "title": short module name (e.g. "Algebra Fundamentals")
- "status": one of "completed", "current", or "locked". The first 1-2 should be "completed", the next "current", the rest "locked"
- "description": 1 short sentence describing what this module covers

Return ONLY the JSON array, no markdown, no explanation. Example format:
[{"title":"Module 1","status":"completed","description":"Week 1 content"},{"title":"Module 2","status":"current","description":"Current focus"}]`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
        }),
      }
    );

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ modules: getDefaultModules(subject) });
    }

    const modules = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ modules });
  } catch (err) {
    console.error("Roadmap generation failed:", err);
    return NextResponse.json({ modules: getDefaultModules(subject) });
  }
}

function getDefaultModules(subject: string) {
  return [
    { title: `${subject} Fundamentals`, status: "completed", description: `Core concepts and foundational principles of ${subject}.` },
    { title: `Intermediate ${subject}`, status: "completed", description: `Building on fundamentals with practical applications.` },
    { title: `Advanced Topics`, status: "current", description: `Diving into complex theories and problem-solving methods.` },
    { title: `Expert Mastery`, status: "locked", description: `Locked until current module complete.` },
    { title: `${subject} Synthesis`, status: "locked", description: `Locked until previous module complete.` },
  ];
}
