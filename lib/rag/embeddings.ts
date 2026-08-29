const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const GEMINI_EMBEDDING_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent";

export interface EmbeddingResult {
  embedding: number[];
}

/**
 * Generate an embedding for a single text using Gemini gemini-embedding-001.
 * Returns a 768-dimensional vector.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const r = await fetch(`${GEMINI_EMBEDDING_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "models/gemini-embedding-001",
      content: { parts: [{ text }] },
      taskType: "RETRIEVAL_DOCUMENT",
      outputDimensionality: 768,
    }),
  });

  if (!r.ok) {
    const msg = await r.text();
    throw new Error(`Gemini embedding failed (${r.status}): ${msg}`);
  }

  const json = await r.json();
  return json.embedding.values;
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
  const r = await fetch(`${GEMINI_EMBEDDING_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "models/gemini-embedding-001",
      content: { parts: [{ text: query }] },
      taskType: "RETRIEVAL_QUERY",
      outputDimensionality: 768,
    }),
  });

  if (!r.ok) {
    const msg = await r.text();
    throw new Error(`Gemini query embedding failed (${r.status}): ${msg}`);
  }

  const json = await r.json();
  return json.embedding.values;
}
