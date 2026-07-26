import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractText } from "@/lib/rag/extractor";
import { chunkPages } from "@/lib/rag/chunker";
import { generateEmbeddings } from "@/lib/rag/embeddings";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

/**
 * POST /api/rag/ingest
 *
 * Background worker: processes a single document through the RAG pipeline.
 * Called after upload completes. Runs server-side only.
 *
 * Flow:
 * 1. Fetch document record + download from Storage
 * 2. Extract text (PDF/PPTX)
 * 3. Chunk into semantic segments
 * 4. Generate embeddings via Gemini
 * 5. Store chunks in pgvector
 * 6. Update document status
 */
export async function POST(request: Request) {
  try {
    const { document_id, user_id } = await request.json();

    if (!document_id || !user_id) {
      return NextResponse.json(
        { error: "document_id and user_id are required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // 1. Fetch document record
    const { data: doc, error: docError } = await supabase
      .from("documents")
      .select("id, filename, file_type, storage_path, status")
      .eq("id", document_id)
      .single();

    if (docError || !doc) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Skip if already processed
    if (doc.status === "READY") {
      return NextResponse.json({ message: "Already processed", chunks: 0 });
    }

    // Update status → EXTRACTING
    await supabase
      .from("documents")
      .update({ status: "EXTRACTING" })
      .eq("id", document_id);

    // 2. Download file from Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("user_documents")
      .download(doc.storage_path);

    if (downloadError || !fileData) {
      await supabase
        .from("documents")
        .update({ status: "FAILED" })
        .eq("id", document_id);
      return NextResponse.json(
        { error: `Failed to download: ${downloadError?.message}` },
        { status: 500 }
      );
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());

    // 3. Extract text
    const extraction = await extractText(buffer, doc.file_type);

    if (!extraction.fullText.trim()) {
      await supabase
        .from("documents")
        .update({ status: "READY" })
        .eq("id", document_id);
      return NextResponse.json({
        message: "No extractable text (image-only document)",
        chunks: 0,
      });
    }

    // Update status → CHUNKING
    await supabase
      .from("documents")
      .update({ status: "CHUNKING" })
      .eq("id", document_id);

    // 4. Chunk the text
    const chunks = chunkPages(extraction.pages, doc.filename);

    if (chunks.length === 0) {
      await supabase
        .from("documents")
        .update({ status: "READY" })
        .eq("id", document_id);
      return NextResponse.json({ message: "No chunks generated", chunks: 0 });
    }

    // Update status → EMBEDDING
    await supabase
      .from("documents")
      .update({ status: "EMBEDDING" })
      .eq("id", document_id);

    // 5. Generate embeddings for all chunks
    const embeddings = await generateEmbeddings(
      chunks.map((c) => c.content)
    );

    // 6. Store chunks in database
    const chunkRecords = chunks.map((chunk, i) => ({
      document_id,
      user_id,
      chunk_index: chunk.chunk_index,
      content: chunk.content,
      embedding: embeddings[i],
      metadata: chunk.metadata,
      page_number: chunk.page_number,
    }));

    // Delete existing chunks for this document (re-indexing)
    await supabase
      .from("document_chunks")
      .delete()
      .eq("document_id", document_id);

    // Bulk insert — batch in groups of 50 to avoid payload limits
    const BATCH_SIZE = 50;
    for (let i = 0; i < chunkRecords.length; i += BATCH_SIZE) {
      const batch = chunkRecords.slice(i, i + BATCH_SIZE);
      const { error: insertError } = await supabase
        .from("document_chunks")
        .insert(batch);

      if (insertError) {
        console.error("Chunk insert error:", insertError);
        await supabase
          .from("documents")
          .update({ status: "FAILED" })
          .eq("id", document_id);
        return NextResponse.json(
          { error: `Failed to store chunks: ${insertError.message}` },
          { status: 500 }
        );
      }
    }

    // Update status → READY
    await supabase
      .from("documents")
      .update({ status: "READY" })
      .eq("id", document_id);

    return NextResponse.json({
      message: "Document indexed successfully",
      chunks: chunkRecords.length,
      pages: extraction.pageCount,
    });
  } catch (error) {
    console.error("Ingest pipeline error:", error);

    // Try to mark document as failed
    try {
      const { document_id } = await request.json().catch(() => ({}));
      if (document_id) {
        const supabase = createAdminClient();
        await supabase
          .from("documents")
          .update({ status: "FAILED" })
          .eq("id", document_id);
      }
    } catch {}

    return NextResponse.json(
      { error: `Ingest failed: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
