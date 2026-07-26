const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const GEMINI_EMBEDDING_URL = "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent";

export interface EmbeddingResult {
  embedding: number[];
}

/**
 * Generate an embedding for a single text using Gemini text-embedding-004.
 * Returns a 768-dimensional vector.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const res = await fetch(`${GEMINI_EMBEDDING_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "models/text-embedding-004",
      content: { parts: [{ text }] },
      taskType: "RETRIEVAL_DOCUMENT",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini embedding failed (${res.status}): ${err}`);
  }

  const data = await res.json();
  return data.embedding.values;
}

/**
 * Generate embeddings for multiple texts in batch.
 * Gemini supports up to 100 texts per request.
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const BATCH_SIZE = 100;
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);

    const results = await Promise.all(
      batch.map((text) => generateEmbedding(text))
    );

    allEmbeddings.push(...results);
  }

  return allEmbeddings;
}

/**
 * Generate an embedding for a search query.
 * Uses RETRIEVAL_QUERY task type for better retrieval.
 */
export async function generateQueryEmbedding(query: string): Promise<number[]> {
  const res = await fetch(`${GEMINI_EMBEDDING_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "models/text-embedding-004",
      content: { parts: [{ text: query }] },
      taskType: "RETRIEVAL_QUERY",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini query embedding failed (${res.status}): ${err}`);
  }

  const data = await res.json();
  return data.embedding.values;
}
