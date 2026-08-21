import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { checkUploadQuota } from "@/lib/usage";

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const quota = await checkUploadQuota(user.id);
  if (!quota.allowed) {
    return NextResponse.json(
      { error: "Knowledge upload limit reached. Upgrade your plan for more uploads." },
      { status: 429 }
    );
  }

  const { url, session_id } = await req.json();
  if (!url) return NextResponse.json({ error: "URL required" }, { status: 400 });

  const fileId = extractGDriveId(url);
  if (!fileId) return NextResponse.json({ error: "Invalid Google Drive URL" }, { status: 400 });

  try {
    const filename = `GoogleDrive - ${fileId}.txt`;
    const storagePath = `${user.id}/${Date.now()}_gdrive_${fileId}.txt`;

    const content = `Google Drive Document\nURL: ${url}\nFile ID: ${fileId}\n\nNote: To fully index this document, please download it and re-upload here, or paste the content directly.`;

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

    if (!ingestRes.ok) {
      const errBody = await ingestRes.json().catch(() => ({}));
      throw new Error(errBody.error || `Ingest failed with status ${ingestRes.status}`);
    }

    return NextResponse.json({ success: true, doc_id: doc.id, title: `Google Drive - ${fileId}` });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

function extractGDriveId(url: string): string | null {
  const patterns = [
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
    /docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/,
    /docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}
