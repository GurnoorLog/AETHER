import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { url, session_id } = await req.json();
  if (!url) return NextResponse.json({ error: "URL required" }, { status: 400 });

  const videoId = extractVideoId(url);
  if (!videoId) return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });

  try {
    const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    const oembed = await oembedRes.json();

    const transcript = await fetchTranscript(videoId);

    const filename = `YouTube - ${oembed.title || videoId}.txt`;
    const storagePath = `${user.id}/${Date.now()}_youtube_${videoId}.txt`;

    const content = `Title: ${oembed.title || "Unknown"}\nAuthor: ${oembed.author_name || "Unknown"}\nURL: https://www.youtube.com/watch?v=${videoId}\n\n--- Transcript ---\n\n${transcript || "Transcript not available. The video may not have captions."}`;

    const { error: uploadError } = await supabase.storage
      .from("user_documents")
      .upload(storagePath, new Blob([content], { type: "text/plain" }), { upsert: true });
    if (uploadError) throw new Error(uploadError.message);

    const { data: doc, error: insertError } = await supabase
      .from("documents")
      .insert({
        user_id: user.id,
        session_id: session_id || null,
        filename,
        file_type: "TXT",
        file_size: content.length,
        storage_path: storagePath,
        status: "UPLOADING",
      })
      .select("id")
      .single();
    if (insertError) throw new Error(insertError.message);

    const ingestRes = await fetch(`${req.nextUrl.origin}/api/rag/ingest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ document_id: doc.id, user_id: user.id, session_id }),
    });

    return NextResponse.json({ success: true, doc_id: doc.id, title: oembed.title });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

async function fetchTranscript(videoId: string): Promise<string> {
  try {
    const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const html = await pageRes.text();

    const captionMatch = html.match(/"captions":\s*(\{[\s\S]*?\})\s*,\s*"videoDetails"/);
    if (!captionMatch) return "";

    const captionData = JSON.parse(captionMatch[1]);
    const tracks = captionData?.playerCaptionsTracklistRenderer?.captionTracks;
    if (!tracks || tracks.length === 0) return "";

    const enTrack = tracks.find((t: { languageCode: string }) => t.languageCode === "en") || tracks[0];
    const captionUrl = enTrack?.baseUrl;
    if (!captionUrl) return "";

    const captionRes = await fetch(captionUrl);
    const captionXml = await captionRes.text();

    const texts = captionXml.match(/<text[^>]*>(.*?)<\/text>/g) || [];
    return texts
      .map((t: string) => t.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"'))
      .join(" ");
  } catch {
    return "";
  }
}
