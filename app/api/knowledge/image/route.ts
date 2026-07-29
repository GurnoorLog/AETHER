import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const session_id = formData.get("session_id") as string | null;

  if (!file) return NextResponse.json({ error: "File required" }, { status: 400 });

  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const filename = file.name;
  const storagePath = `${user.id}/${Date.now()}_${filename}`;

  try {
    const { error: uploadError } = await supabase.storage
      .from("user_documents")
      .upload(storagePath, file, { upsert: true });
    if (uploadError) throw new Error(uploadError.message);

    const { data: doc, error: insertError } = await supabase
      .from("documents")
      .insert({
        user_id: user.id,
        session_id: session_id || null,
        filename,
        file_type: ext.toUpperCase(),
        file_size: file.size,
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

    return NextResponse.json({ success: true, doc_id: doc.id, filename });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
