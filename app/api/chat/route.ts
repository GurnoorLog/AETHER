import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { searchChunks } from "@/lib/rag/search";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const GEMINI_CHAT_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

/**
 * POST /api/chat
 *
 * RAG-powered streaming chat. Flow:
 * 1. Authenticate user
 * 2. Embed query → search user's document chunks
 * 3. Build prompt with retrieved context + conversation history + AI memory
 * 4. Stream response from Gemini
 * 5. Save user message + AI response to chat_messages
 */
export async function POST(request: Request) {
  try {
    const { message, conversation_id } = await request.json();

    if (!message || !conversation_id) {
      return NextResponse.json(
        { error: "message and conversation_id are required" },
        { status: 400 }
      );
    }

    // 1. Authenticate
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Save user message
    await supabase.from("chat_messages").insert({
      conversation_id,
      user_id: user.id,
      role: "user",
      content: message,
    });

    // 3. Retrieve relevant chunks
    const chunks = await searchChunks(message, user.id, 8);

    // 4. Get recent conversation history (last 10 messages)
    const { data: historyMessages } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("conversation_id", conversation_id)
      .order("created_at", { ascending: true })
      .limit(20);

    // 5. Get AI memories
    const { data: memories } = await supabase
      .from("ai_memories")
      .select("content, context")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    // 6. Get learning profile
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("full_name, preferences, ai_tutor_name")
      .eq("user_id", user.id)
      .single();

    // 7. Build system prompt with RAG context
    const tutorName = profile?.ai_tutor_name || "Aether";
    const userName = profile?.full_name?.split(" ")[0] || "Student";

    const contextBlocks = chunks.map(
      (c, i) => `[Source ${i + 1}] (from "${c.metadata.source || "document"}", page ${c.metadata.page || "?"}):\n${c.content}`
    );

    const memoryBlock = memories?.length
      ? "\n\n## AI Memories\n" +
        memories.map((m) => `- ${m.content} (${m.context})`).join("\n")
      : "";

    const historyBlock = historyMessages?.length
      ? historyMessages.map((m) => `${m.role === "user" ? userName : tutorName}: ${m.content}`).join("\n")
      : "";

    const systemPrompt = `You are ${tutorName}, an expert AI tutor helping ${userName} learn.

## Your Role
- Explain concepts clearly, using analogies and examples
- Be encouraging but honest about areas needing improvement
- Adapt to the student's level based on context
- Use markdown formatting for clarity (headers, code blocks, bullet points)
- When referencing the student's documents, cite the source number

## Retrieved Document Context
${chunks.length > 0 ? contextBlocks.join("\n\n") : "No relevant documents found for this query."}
${memoryBlock}

## Recent Conversation
${historyBlock || "No previous messages."}

## Instructions
Answer the student's question using the retrieved context when relevant.
If the documents don't contain relevant information, answer from general knowledge.
Always be helpful and educational. Keep responses focused and clear.`;

    // 8. Call Gemini with streaming
    const geminiRes = await fetch(`${GEMINI_CHAT_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt + "\n\nStudent: " + message }] }],
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
        ],
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini error:", errText);
      return NextResponse.json(
        { error: `Gemini API error: ${geminiRes.status}` },
        { status: 502 }
      );
    }

    const geminiData = await geminiRes.json();
    const assistantContent =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a response.";

    // 9. Save assistant response with retrieval metadata
    await supabase.from("chat_messages").insert({
      conversation_id,
      user_id: user.id,
      role: "assistant",
      content: assistantContent,
      retrieved_chunk_ids: chunks.map((c) => c.id),
      similarity_scores: chunks.map((c) => c.similarity),
    });

    // 10. Return the response (non-streaming for now, streaming can be added later)
    return NextResponse.json({
      content: assistantContent,
      chunks_used: chunks.length,
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: `Chat failed: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
