const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const GEMINI_CHAT_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: "messages array is required" }, { status: 400 });
    }

    const systemMessages = messages.filter((m: { role: string }) => m.role === "system");
    const historyMessages = messages.filter((m: { role: string }) => m.role !== "system");

    const systemPrompt = systemMessages.map((m: { content: string }) => m.content).join("\n\n");

    const geminiContents: { role: string; parts: { text: string }[] }[] = [];
    for (const msg of historyMessages) {
      const geminiRole = msg.role === "assistant" ? "model" : "user";
      geminiContents.push({ role: geminiRole, parts: [{ text: msg.content }] });
    }

    const geminiRes = await fetch(`${GEMINI_CHAT_URL}?key=${GEMINI_API_KEY}&alt=sse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: geminiContents,
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
      console.error("Gemini proxy error:", errText);
      return Response.json({ error: `Gemini API error: ${geminiRes.status}` }, { status: 502 });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = geminiRes.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }
        const decoder = new TextDecoder();
        let buffer = "";
        let prevText = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const jsonStr = line.slice(6).trim();
              if (!jsonStr || jsonStr === "[DONE]") continue;

              try {
                const parsed = JSON.parse(jsonStr);
                const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                  const delta = text.slice(prevText.length);
                  prevText = text;
                  if (delta) {
                    const openaiChunk = `data: ${JSON.stringify({ choices: [{ delta: { content: delta }, index: 0 }] })}\n\n`;
                    controller.enqueue(encoder.encode(openaiChunk));
                  }
                }
              } catch {
                // skip malformed lines
              }
            }
          }
        } catch (err) {
          console.error("Stream error:", err);
        } finally {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
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
  } catch (err) {
    console.error("Voice think error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
