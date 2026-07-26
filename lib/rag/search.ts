import { createAdminClient } from "@/lib/supabase/admin";
import { generateQueryEmbedding } from "./embeddings";

export interface SearchResult {
  id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  metadata: Record<string, unknown>;
  page_number: number | null;
  similarity: number;
}

/**
 * Semantic search: embed query → pgvector cosine similarity → top-K results.
 * Scoped to a specific user via RLS.
 */
export async function searchChunks(
  query: string,
  userId: string,
  matchCount: number = 10,
  sessionId?: string | null
): Promise<SearchResult[]> {
  const embedding = await generateQueryEmbedding(query);
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("match_document_chunks", {
    query_embedding: embedding,
    match_count: matchCount,
    target_user_id: userId,
    target_session_id: sessionId || null,
  });

  if (error) {
    throw new Error(`Semantic search failed: ${error.message}`);
  }

  return (data as SearchResult[]) || [];
}
