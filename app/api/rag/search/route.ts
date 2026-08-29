import { NextResponse } from "next/server";
import { searchChunks } from "@/lib/rag/search";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * POST /api/rag/search
 *
 * Semantic search endpoint. Embeds the query, searches pgvector,
 * returns top-K matching chunks scoped to the authenticated user.
 */
export async function POST(request: Request) {
  try {
    const { query, match_count = 10 } = await request.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "query string is required" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const results = await searchChunks(query, user.id, match_count);

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: `Search failed: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}