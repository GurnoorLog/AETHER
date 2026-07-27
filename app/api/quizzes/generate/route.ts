import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(req: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { module_id, session_id, subject, title, num_questions } = await req.json();

  let moduleData: {
    title: string;
    description: string;
    learning_objectives: string;
    key_concepts: string;
    lessons: { title: string; description: string; key_topics: string[] }[];
  } | null = null;

  if (module_id) {
    const { data } = await supabase
      .from("session_roadmap_modules")
      .select("*")
      .eq("id", module_id)
      .eq("user_id", user.id)
      .single();
    if (data) {
      moduleData = {
        title: data.title,
        description: data.description || "",
        learning_objectives: data.learning_objectives || "",
        key_concepts: data.key_concepts || "",
        lessons: typeof data.lessons === "string" ? JSON.parse(data.lessons) : (data.lessons || []),
      };
    }
  }

  const questionCount = Math.min(Math.max(num_questions || 10, 5), 20);
  const quizTitle = title || (moduleData ? `Quiz: ${moduleData.title}` : `Quiz: ${subject || "General Knowledge"}`);

  const lessonsBlock = moduleData?.lessons?.length
    ? moduleData.lessons.map((l, i) =>
      `Lesson ${i + 1}: ${l.title}\n${l.description}\nTopics: ${l.key_topics?.join(", ")}`
    ).join("\n\n")
    : "";

  const prompt = `You are an expert quiz generator for an AI learning platform. Generate a ${questionCount}-question multiple-choice quiz.

${moduleData ? `Module: ${moduleData.title}
Description: ${moduleData.description || "N/A"}

Learning Objectives:
${moduleData.learning_objectives || "N/A"}

Key Concepts: ${moduleData.key_concepts || "N/A"}

Lessons:
${lessonsBlock}
` : `Subject: ${subject || "General Knowledge"}`}

## Requirements
- Generate exactly ${questionCount} questions
- Each question must have exactly 4 options
- Questions should test understanding, not just memorization
- Include a mix of difficulty levels (easy, medium, hard)
- Each question must have a clear correct answer
- The explanation should be educational and help the student learn
- Questions should cover the key concepts and topics listed above

Return ONLY a JSON array. No markdown, no explanation. Format:
[{"question":"What is...?","options":["A","B","C","D"],"correct_index":0,"explanation":"Because..."}]`;

  try {
    const geminiRes = await fetch(
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

    const data = await geminiRes.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Failed to generate quiz questions" }, { status: 500 });
    }

    const questions = JSON.parse(jsonMatch[0]);

    // Save quiz to DB
    const { data: quiz, error: quizError } = await supabase
      .from("session_quizzes")
      .insert({
        session_id: session_id,
        user_id: user.id,
        module_id: module_id || null,
        title: quizTitle,
        questions: JSON.stringify(questions),
        total_questions: questions.length,
        completed: false,
      })
      .select("id, title, questions, total_questions, created_at")
      .single();

    if (quizError) {
      console.error("Quiz save error:", quizError);
      return NextResponse.json({ error: "Failed to save quiz" }, { status: 500 });
    }

    return NextResponse.json({
      quiz: {
        ...quiz,
        questions: typeof quiz.questions === "string" ? JSON.parse(quiz.questions) : quiz.questions,
      },
    });
  } catch (err) {
    console.error("Quiz generation failed:", err);
    return NextResponse.json({ error: "Quiz generation failed" }, { status: 500 });
  }
}
