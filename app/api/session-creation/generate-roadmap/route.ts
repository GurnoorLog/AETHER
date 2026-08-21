import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

function extractSubject(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  // Extract topic from "i want to learn about X", "learn X", "study X" etc.
  const patterns = [
    /^i'?m?\s+(?:trying\s+to\s+)?(?:want\s+to\s+)?(?:learn|study|understand|master|know)\s+(?:about\s+|how\s+)?(.+)$/i,
    /^i\s+(?:want\s+to\s+)?(?:learn|study)\s+(.+)$/i,
  ];
  for (const p of patterns) {
    const m = trimmed.match(p);
    if (m) return m[1].trim();
  }
  return trimmed;
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { subject: rawSubject, mode, difficulty, duration, objectives: rawObjectives } = await req.json();

  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "Missing GEMINI_API_KEY" },
      { status: 500 }
    );
  }

  // Clean subject for prompt — extract real topic from sentence input
  const cleanSubj = extractSubject(rawSubject || "");
  const subject = cleanSubj || rawSubject || "this topic";
  const objectives = [rawObjectives, rawSubject !== subject ? rawSubject : ""].filter(Boolean).join(". ") || "General mastery";

  const prompt = `You are an AI learning path designer. Generate a structured learning roadmap for "${subject}".

Configuration:
- Objectives: ${objectives}

CRITICAL: Create modules that are SPECIFIC to "${subject}" and the objectives above. Module names MUST be concrete and directly about the topic — NOT generic like "Fundamentals of X" or "Intermediate X".

Return a JSON object with:
- "title": a concise, specific session name (e.g. "Python Fundamentals for Data Science" or "Mastering Calculus: Derivatives & Integrals") — NOT generic like "Physics Study Session"
- "modules": a JSON array of 4-6 modules. Each module must have:
- "title": short, SPECIFIC module name directly about ${subject}
- "status": one of "completed", "current", or "locked". The first 1-2 should be "completed", the next "current", the rest "locked"
- "description": 1 short sentence
- "learning_objectives": string of 3-5 objectives separated by newlines
- "key_concepts": string of key terms separated by commas
- "lessons": array of 2-4 lessons, each with:
  - "title": lesson name
  - "description": 1 sentence
  - "duration_minutes": 10-30
  - "key_topics": array of 2-4 specific topics

Return ONLY the JSON object, no markdown, no explanation.`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
        }),
      }
    );

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    const cleaned = text.replace(/```(?:json)?\s*/g, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Roadmap: no JSON in Gemini response:", text.slice(0, 500));
      const modules = getDefaultModules(subject, objectives);
      return NextResponse.json({ title: `${subject} Roadmap`, modules });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const modules = parsed.modules || parsed;
    const title = parsed.title || `${subject} Roadmap`;
    return NextResponse.json({ title, modules });
  } catch (err) {
    console.error("Roadmap generation failed:", err);
    return NextResponse.json({ modules: getDefaultModules(subject, objectives) });
  }
}

function getDefaultModules(subject: string, _objectives?: string) {
  return [
    {
      title: `Introduction to ${subject}`,
      status: "completed",
      description: `Core concepts and foundational principles of ${subject}.`,
      learning_objectives: `- Understand the fundamental concepts\n- Identify key terminology and principles`,
      key_concepts: `fundamentals, core principles, terminology`,
      lessons: [
        { title: "Core Concepts", description: "Learn the essential concepts and vocabulary.", duration_minutes: 15, key_topics: ["definitions", "basic concepts"] },
        { title: "Foundational Principles", description: "Understand the building blocks.", duration_minutes: 20, key_topics: ["principles", "framework"] },
      ],
    },
    {
      title: `${subject} in Practice`,
      status: "current",
      description: `Applying ${subject} concepts to real-world scenarios.`,
      learning_objectives: `- Apply concepts to practical problems\n- Develop analytical skills`,
      key_concepts: `application, analysis, practical methods`,
      lessons: [
        { title: "Practical Applications", description: "Putting theory into practice.", duration_minutes: 20, key_topics: ["applications", "practice"] },
        { title: "Case Studies", description: "Analyze real-world examples.", duration_minutes: 25, key_topics: ["case studies", "analysis"] },
      ],
    },
    {
      title: `Advanced ${subject}`,
      status: "locked",
      description: `Diving deeper into complex aspects of ${subject}.`,
      learning_objectives: `- Master advanced concepts\n- Solve complex problems`,
      key_concepts: `advanced theory, complex problem-solving, synthesis`,
      lessons: [
        { title: "Advanced Concepts", description: "Explore complex theoretical frameworks.", duration_minutes: 25, key_topics: ["theory", "advanced concepts"] },
        { title: "Expert Workshop", description: "Tackle challenging problems.", duration_minutes: 30, key_topics: ["workshop", "advanced problems"] },
      ],
    },
    {
      title: `${subject} Mastery`,
      status: "locked",
      description: `Achieving expert-level understanding of ${subject}.`,
      learning_objectives: `- Demonstrate expert-level understanding\n- Synthesize and evaluate knowledge`,
      key_concepts: `expertise, synthesis, evaluation`,
      lessons: [
        { title: "Expert Synthesis", description: "Synthesize all knowledge comprehensively.", duration_minutes: 20, key_topics: ["synthesis", "mastery"] },
      ],
    },
  ];
}
