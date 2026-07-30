import { createServerSupabaseClient } from "@/lib/supabase/server";
import { searchChunks } from "@/lib/rag/search";
import { checkUsage, incrementUsage } from "@/lib/usage";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const GEMINI_CHAT_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent";

function sseEvent(type: string, data: unknown): string {
  return `data: ${JSON.stringify({ type, ...((typeof data === "object" && data !== null) ? data : { text: data }) })}\n\n`;
}

export async function POST(request: Request) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (type: string, data: unknown) => {
        controller.enqueue(encoder.encode(sseEvent(type, data)));
      };

      try {
        const { message, conversation_id, session_id, module_context } = await request.json();

        if (!message || !conversation_id) {
          send("error", { error: "message and conversation_id are required" });
          controller.close();
          return;
        }

        // 1. Authenticate
        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          send("error", { error: "Unauthorized" });
          controller.close();
          return;
        }

        // 2. Check chat usage limit
        const usage = await checkUsage(user.id, "chat");
        if (!usage.allowed) {
          send("error", { error: "Chat limit reached. You have used all 10 messages. Contact support to increase your limit." });
          controller.close();
          return;
        }

        // 3. Save user message
        const { error: userMsgErr } = await supabase.from("chat_messages").insert({
          conversation_id,
          user_id: user.id,
          role: "user",
          content: message,
        });
        if (userMsgErr) console.error("Failed to save user message:", userMsgErr);

        await incrementUsage(user.id, "chat");

        // 4. Retrieve relevant chunks — show file checking status
        send("status", { text: "Searching your documents..." });
        const chunks = await searchChunks(message, user.id, 8, session_id);

        // Extract unique filenames from chunks
        const uniqueFiles = [...new Set(chunks.map((c) => c.metadata.source).filter(Boolean))];

        if (uniqueFiles.length > 0) {
          for (const filename of uniqueFiles) {
            send("status", { text: `Checking ${filename}` });
            // Small delay so user can see each file being checked
            await new Promise((r) => setTimeout(r, 300));
          }
        } else {
          send("status", { text: "No matching documents found" });
        }

        send("status", { text: "Generating response..." });

        // 4. Get recent conversation history
        const { data: historyMessages, error: histErr } = await supabase
          .from("chat_messages")
          .select("role, content")
          .eq("conversation_id", conversation_id)
          .order("created_at", { ascending: true })
          .limit(20);
        if (histErr) console.error("Failed to fetch history:", histErr);

        // 5. Get AI memories
        const { data: memories, error: memErr } = await supabase
          .from("ai_memories")
          .select("content, context")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5);
        if (memErr) console.error("Failed to fetch memories:", memErr);

        // 6. Get learning profile
        const { data: profile, error: profileErr } = await supabase
          .from("user_profiles")
          .select("full_name, preferences, ai_tutor_name")
          .eq("user_id", user.id)
          .single();
        if (profileErr && profileErr.code !== "PGRST116") console.error("Failed to fetch profile:", profileErr);

        // 7. Build system prompt
        const tutorName = profile?.ai_tutor_name || "Aether";
        const userName = profile?.full_name?.split(" ")[0] || "Student";

        const contextBlocks = chunks.map(
          (c, i) => `[Source ${i + 1}] (from "${c.metadata.source || "document"}", page ${c.metadata.page || "?"}):\n${c.content}`
        );

        const memoryBlock = memories?.length
          ? "\n\n## AI Memories\n" + memories.map((m) => `- ${m.content} (${m.context})`).join("\n")
          : "";

        const historyBlock = historyMessages?.length
          ? historyMessages.map((m) => `${m.role === "user" ? userName : tutorName}: ${m.content}`).join("\n")
          : "";

        // Module-aware system prompt
        let moduleSection = "";
        let resolvedContext = module_context;
        if (!resolvedContext && session_id) {
          const { data: firstModule } = await supabase
            .from("session_roadmap_modules")
            .select("title, description, lessons, learning_objectives, key_concepts")
            .eq("session_id", session_id)
            .eq("user_id", user.id)
            .order("module_index", { ascending: true })
            .limit(1)
            .single();
          if (firstModule) {
            let parsedLessons = firstModule.lessons;
            if (typeof parsedLessons === "string") {
              try { parsedLessons = JSON.parse(parsedLessons); } catch { parsedLessons = []; }
            }
            resolvedContext = {
              title: firstModule.title,
              description: firstModule.description || "",
              lessons: Array.isArray(parsedLessons) ? parsedLessons : [],
              learning_objectives: firstModule.learning_objectives || "",
              key_concepts: firstModule.key_concepts || "",
            };
          }
        }
        if (resolvedContext) {
          const mc = resolvedContext as {
            title: string;
            description: string;
            lessons: { title: string; description: string; key_topics: string[] }[];
            learning_objectives: string;
            key_concepts: string;
          };

          const lessonsBlock = mc.lessons?.length
            ? mc.lessons.map((l, i) =>
              `### Lesson ${i + 1}: ${l.title}\n${l.description}\nTopics: ${l.key_topics?.join(", ")}`
            ).join("\n\n")
            : "No lessons defined.";

          moduleSection = `
## Active Module Context
You are currently teaching the module: **${mc.title}**
${mc.description ? `\nDescription: ${mc.description}` : ""}

${mc.learning_objectives ? `\n## Learning Objectives\n${mc.learning_objectives}` : ""}

${mc.key_concepts ? `\n## Key Concepts\n${mc.key_concepts}` : ""}

## Lessons
${lessonsBlock}

## Teaching Instructions
- Guide the student through this module lesson by lesson
- Start with the first lesson and work through systematically
- Use examples, analogies, and practice problems
- Check understanding before moving to the next lesson
- When the student has covered all lessons in this module, say: "You've completed all lessons in ${mc.title}! Head to the Quizzes section to test your knowledge with a quiz on this module."
- If the student asks about topics outside this module, still help them but gently redirect back
`;
        }

        const systemPrompt = `You are ${tutorName}, an expert AI tutor helping ${userName} learn.

## Your Role
- Explain concepts clearly, using analogies and examples
- Be encouraging but honest about areas needing improvement
- Adapt to the student's level based on context
- Use markdown formatting for clarity (headers, code blocks, bullet points)
- Use Mermaid.js diagrams for concept maps, flowcharts, timelines, and relationships. Enclose them in triple-backtick blocks with the \`mermaid\` language tag. Example: \`\`\`mermaid\nflowchart LR\n  A-->B\n\`\`\`
- When referencing the student's documents, cite the source number
${moduleSection}
## Retrieved Document Context
${chunks.length > 0 ? contextBlocks.join("\n\n") : "No relevant documents found for this query."}
${memoryBlock}

## Recent Conversation
${historyBlock || "No previous messages."}

## Instructions
Answer the student's question using the retrieved context when relevant.
${moduleSection ? "Always relate answers back to the active module content when possible." : "If the documents don't contain relevant information, answer from general knowledge."}
Always be helpful and educational. Keep responses focused and clear.`;

        // 8. Call Gemini with streaming
        const geminiRes = await fetch(`${GEMINI_CHAT_URL}?key=${GEMINI_API_KEY}&alt=sse`, {
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

          }),
        });

        if (!geminiRes.ok) {
          const errText = await geminiRes.text();
          console.error("Gemini error:", errText);
          send("error", { error: `Gemini API error: ${geminiRes.status}` });
          controller.close();
          return;
        }

        // Stream the Gemini response
        const reader = geminiRes.body?.getReader();
        const decoder = new TextDecoder();
        let fullText = "";
        let buffer = "";

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            // Parse SSE chunks from Gemini
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const jsonStr = line.slice(6).trim();
                if (jsonStr === "[DONE]") continue;
                try {
                  const chunk = JSON.parse(jsonStr);
                  const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text;
                  if (text) {
                    fullText += text;
                    send("chunk", { text });
                  }
                } catch {
                  // skip malformed chunks
                }
              }
            }
          }
        }

        // If Gemini didn't stream, try non-streaming parse
        if (!fullText) {
          try {
            const geminiData = JSON.parse(buffer);
            fullText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a response.";
            send("chunk", { text: fullText });
          } catch {
            fullText = "I couldn't generate a response.";
            send("chunk", { text: fullText });
          }
        }

        // 9. Save assistant response
        const { error: saveErr } = await supabase.from("chat_messages").insert({
          conversation_id,
          user_id: user.id,
          role: "assistant",
          content: fullText,
          retrieved_chunk_ids: chunks.map((c) => c.id),
          similarity_scores: chunks.map((c) => c.similarity),
        });
        if (saveErr) console.error("Failed to save assistant message:", saveErr);

        const { data: savedMsg } = await supabase
          .from("chat_messages")
          .select("id")
          .eq("conversation_id", conversation_id)
          .eq("role", "assistant")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        send("done", { message_id: savedMsg?.id || null, chunks_used: chunks.length });
        controller.close();
      } catch (error) {
        const send = (type: string, data: unknown) => {
          controller.enqueue(encoder.encode(sseEvent(type, data)));
        };
        send("error", { error: `Chat failed: ${(error as Error).message}` });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
