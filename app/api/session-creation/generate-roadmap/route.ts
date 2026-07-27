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
- "learning_objectives": a string listing 3-5 specific learning objectives separated by newlines
- "key_concepts": a string listing the key concepts/theorems/terms separated by commas
- "lessons": an array of 2-4 lessons, each with:
  - "title": lesson name (e.g. "Introduction to Variables")
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
    {
      title: `${subject} Fundamentals`,
      status: "completed",
      description: `Core concepts and foundational principles of ${subject}.`,
      learning_objectives: `- Understand the basic terminology\n- Identify core principles`,
      key_concepts: `fundamentals, core principles, terminology`,
      lessons: [
        { title: "Core Terminology", description: "Learn the essential vocabulary.", duration_minutes: 15, key_topics: ["definitions", "basic terms"] },
        { title: "Foundational Principles", description: "Understand the building blocks.", duration_minutes: 20, key_topics: ["principles", "framework"] },
      ],
    },
    {
      title: `Intermediate ${subject}`,
      status: "completed",
      description: `Building on fundamentals with practical applications.`,
      learning_objectives: `- Apply concepts to real problems\n- Develop analytical skills`,
      key_concepts: `application, analysis, practical methods`,
      lessons: [
        { title: "Applied Concepts", description: "Putting theory into practice.", duration_minutes: 20, key_topics: ["applications", "practice"] },
        { title: "Analytical Methods", description: "Develop problem-solving approaches.", duration_minutes: 25, key_topics: ["analysis", "methodology"] },
      ],
    },
    {
      title: `Advanced Topics`,
      status: "current",
      description: `Diving into complex theories and problem-solving methods.`,
      learning_objectives: `- Master advanced techniques\n- Solve complex problems`,
      key_concepts: `advanced theory, complex problem-solving, synthesis`,
      lessons: [
        { title: "Complex Theories", description: "Explore advanced theoretical frameworks.", duration_minutes: 25, key_topics: ["theory", "advanced concepts"] },
        { title: "Problem-Solving Workshop", description: "Tackle challenging problems.", duration_minutes: 30, key_topics: ["workshop", "advanced problems"] },
      ],
    },
    {
      title: `Expert Mastery`,
      status: "locked",
      description: `Locked until current module complete.`,
      learning_objectives: `- Demonstrate expert-level understanding\n- Apply to novel situations`,
      key_concepts: `expertise, novel application, mastery`,
      lessons: [
        { title: "Expert Techniques", description: "Master expert-level methods.", duration_minutes: 20, key_topics: ["expert methods", "mastery"] },
      ],
    },
  ];
}
