import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const maxDuration = 60;

const INTERACTIONS_API =
  "https://generativelanguage.googleapis.com/v1beta/interactions";
const LYRIA_MODELS = new Set(["lyria-3-clip-preview", "lyria-3.5"]);
const AUDIO_BUCKET = "track-audio";

type AudioBlock = { data: string; mime_type?: string };

function collectAudioBlocks(value: unknown, out: AudioBlock[] = []): AudioBlock[] {
  if (Array.isArray(value)) {
    for (const item of value) collectAudioBlocks(item, out);
  } else if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (record.type === "audio" && typeof record.data === "string" && record.data.length > 0) {
      out.push({
        data: record.data,
        mime_type: typeof record.mime_type === "string" ? record.mime_type : undefined,
      });
    }
    for (const child of Object.values(record)) collectAudioBlocks(child, out);
  }
  return out;
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });

  let body: { prompt?: unknown; lyrics?: unknown; model?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt) return NextResponse.json({ error: "prompt is required" }, { status: 400 });

  const lyrics = typeof body.lyrics === "string" ? body.lyrics.trim() : "";
  const model =
    typeof body.model === "string" && LYRIA_MODELS.has(body.model)
      ? body.model
      : "lyria-3-clip-preview";

  const input = lyrics
    ? `Create a song with vocals. Lyrics:\n${lyrics}\n\nStyle direction: ${prompt}`
    : prompt;

  let geminiRes: Response;
  try {
    geminiRes = await fetch(INTERACTIONS_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({ model, input }),
      signal: AbortSignal.timeout(120_000),
    });
  } catch (err) {
    console.error("Lyria request error", err);
    return NextResponse.json({ error: "Lyria request failed" }, { status: 502 });
  }

  if (!geminiRes.ok) {
    const text = await geminiRes.text().catch(() => "");
    let message = `Lyria error (${geminiRes.status})`;
    try {
      const parsed = JSON.parse(text) as { error?: { message?: string } };
      if (parsed.error?.message) message = parsed.error.message;
    } catch {
      // keep fallback message
    }
    const billingHint =
      geminiRes.status === 403 || geminiRes.status === 429 || /billing|paid|quota|cannot|not eligible/i.test(message)
        ? " — Lyria requires a paid (billed) Google AI plan. Check that billing is enabled and the Generative Language API is on."
        : "";
    console.error("Lyria API error", geminiRes.status, text);
    return NextResponse.json({ error: message + billingHint }, { status: 502 });
  }

  const data = await geminiRes.json().catch(() => null);
  const blocks = collectAudioBlocks(data);
  const last = blocks[blocks.length - 1];
  if (!last) {
    console.error("Lyria returned no audio", JSON.stringify(data).slice(0, 2000));
    return NextResponse.json({ error: "Gemini returned no audio" }, { status: 502 });
  }

  const buffer = Buffer.from(last.data, "base64");
  const mimeType = last.mime_type || "audio/mpeg";
  const extension = mimeType === "audio/wav" ? "wav" : "mp3";
  const objectPath = `tracks/lyria-${Date.now()}-${randomUUID()}.${extension}`;

  const admin = createAdminClient();
  let publicUrl: string;
  try {
    const { data: bucket } = await admin.storage.getBucket(AUDIO_BUCKET);
    if (!bucket) {
      const { error: created } = await admin.storage.createBucket(AUDIO_BUCKET, { public: true });
      if (created) throw created;
    }
    const { error: uploadErr } = await admin.storage
      .from(AUDIO_BUCKET)
      .upload(objectPath, buffer, { contentType: mimeType, upsert: false });
    if (uploadErr) throw uploadErr;
    const { data: urlData } = admin.storage.from(AUDIO_BUCKET).getPublicUrl(objectPath);
    publicUrl = urlData.publicUrl;
  } catch (err) {
    console.error("Audio storage error", err);
    return NextResponse.json({ error: "Could not save track" }, { status: 500 });
  }

  return NextResponse.json({
    audio_url: `/api/proxy-audio?url=${encodeURIComponent(publicUrl)}`,
  });
}