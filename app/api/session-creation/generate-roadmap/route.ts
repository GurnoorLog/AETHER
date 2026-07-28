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

CRITICAL: The roadmap MUST be SPECIFIC to the subject and objectives above. Do NOT use generic module names like "${subject} Fundamentals" or "Intermediate ${subject}". Instead, create modules that directly address the specific topic or objectives.

For example, if the subject is "Literature" and objectives mention "Dante", modules should be like "Dante's Life and Historical Context", "The Divine Comedy: Inferno", etc. — not "Literature Fundamentals".

Return a JSON array of 4-6 modules. Each module must have:
- "title": short, SPECIFIC module name
- "status": one of "completed", "current", or "locked". The first 1-2 should be "completed", the next "current", the rest "locked"
- "description": 1 short sentence describing what this module covers
- "learning_objectives": a string listing 3-5 specific learning objectives separated by newlines
- "key_concepts": a string listing the key concepts/theorems/terms separated by commas
- "lessons": an array of 2-4 lessons, each with:
  - "title": lesson name
  - "description": 1 sentence about what this lesson teaches
  - "duration_minutes": estimated minutes (10-30)
  - "key_topics": array of 2-4 specific topics covered in this lesson

Return ONLY the JSON array, no markdown, no explanation. Example format:
[{"title":"Module 1","status":"completed","description":"Week 1 content","learning_objectives":"- Objective 1\n- Objective 2","key_concepts":"concept1, concept2","lessons":[{"title":"Lesson 1","description":"Intro","duration_minutes":15,"key_topics":["topic1","topic2"]}]}]`;

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

    // Strip markdown code fences before parsing
    const cleaned = text.replace(/```(?:json)?\s*/g, "").trim();
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("Roadmap: no JSON found in Gemini response:", text.slice(0, 500));
      return NextResponse.json({ modules: getDefaultModules(subject, objectives) });
    }

    const modules = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ modules });
  } catch (err) {
    console.error("Roadmap generation failed:", err);
    return NextResponse.json({ modules: getDefaultModules(subject, objectives) });
  }
}

function getDefaultModules(subject: string, objectives?: string) {
  const focus = objectives || subject;
  return [
    {
      title: `Foundations of ${focus}`,
      status: "completed",
      description: `Core concepts and foundational principles of ${focus}.`,
      learning_objectives: `- Understand the fundamental concepts of ${focus}\n- Identify key terminology and principles`,
      key_concepts: `fundamentals, core principles, terminology`,
      lessons: [
        { title: "Introduction to Core Ideas", description: "Learn the essential concepts and vocabulary.", duration_minutes: 15, key_topics: ["definitions", "basic concepts"] },
        { title: "Foundational Principles", description: "Understand the building blocks.", duration_minutes: 20, key_topics: ["principles", "framework"] },
      ],
    },
    {
      title: `Key Topics in ${focus}`,
      status: "completed",
      description: `Exploring the major topics and themes within ${focus}.`,
      learning_objectives: `- Explore major themes and topics\n- Connect concepts to broader context`,
      key_concepts: `major themes, key topics, context`,
      lessons: [
        { title: "Major Themes", description: "Survey the key themes and topics.", duration_minutes: 20, key_topics: ["themes", "overview"] },
        { title: "Context and Connections", description: "Understand how topics relate to each other.", duration_minutes: 25, key_topics: ["connections", "context"] },
      ],
    },
    {
      title: `Advanced Study of ${focus}`,
      status: "current",
      description: `Diving deeper into advanced aspects of ${focus}.`,
      learning_objectives: `- Master advanced concepts\n- Apply knowledge to complex scenarios`,
      key_concepts: `advanced concepts, deep analysis, synthesis`,
      lessons: [
        { title: "Advanced Concepts", description: "Explore complex and nuanced topics.", duration_minutes: 25, key_topics: ["advanced theory", "deep analysis"] },
        { title: "Practical Application", description: "Apply what you've learned to real scenarios.", duration_minutes: 30, key_topics: ["application", "problem-solving"] },
      ],
    },
    {
      title: `Mastery of ${focus}`,
      status: "locked",
      description: `Achieving expert-level understanding of ${focus}.`,
      learning_objectives: `- Demonstrate expert-level understanding\n- Synthesize and evaluate knowledge`,
      key_concepts: `expertise, synthesis, evaluation`,
      lessons: [
        { title: "Expert Synthesis", description: "Synthesize all knowledge into comprehensive understanding.", duration_minutes: 20, key_topics: ["synthesis", "mastery"] },
      ],
    },
  ];
}
