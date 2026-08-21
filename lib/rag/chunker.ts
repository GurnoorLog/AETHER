export interface Chunk {
  content: string;
  chunk_index: number;
  page_number: number | null;
  metadata: {
    heading?: string;
    section?: string;
    page?: number;
    source?: string;
    chunk?: number;
  };
}

interface ChunkOptions {
  maxTokens?: number;   // Default 600
  overlapTokens?: number; // Default 100
}

const DEFAULT_OPTIONS: ChunkOptions = {
  maxTokens: 600,
  overlapTokens: 100,
};

/**
 * Rough token count estimation.
 * ~1 token per 4 characters for English text.
 * Good enough for chunking — not for billing.
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Split text into sentences. Handles common abbreviations.
 */
function splitSentences(text: string): string[] {
  const sentences = text
    .replace(/\n{2,}/g, "|||PARA|||")
    .split(/(?<=[.!?])\s+(?=[A-Z\d"'\(])/)
    .map((s) => s.replace(/\|\|\|PARA\|\|\|/g, "\n\n").trim())
    .filter((s) => s.length > 0);

  return sentences;
}

/**
 * Semantic chunking: split text into chunks of ~maxTokens with overlap.
 * Respects sentence boundaries — never splits mid-sentence.
 * Respects page boundaries when page info is available.
 */
export function chunkText(
  text: string,
  sourceFilename: string,
  pageNumber: number | null,
  options: ChunkOptions = {}
): Chunk[] {
  const { maxTokens = 600, overlapTokens = 100 } = { ...DEFAULT_OPTIONS, ...options };

  const sentences = splitSentences(text);
  const chunks: Chunk[] = [];
  let currentChunk: string[] = [];
  let currentTokens = 0;
  let chunkIndex = 0;

  for (const sentence of sentences) {
    const sentenceTokens = estimateTokens(sentence);

    if (currentTokens + sentenceTokens > maxTokens && currentChunk.length > 0) {
      // Flush current chunk
      chunks.push({
        content: currentChunk.join(" "),
        chunk_index: chunkIndex,
        page_number: pageNumber,
        metadata: {
          source: sourceFilename,
          page: pageNumber ?? undefined,
          chunk: chunkIndex,
        },
      });
      chunkIndex++;

      // Keep overlap: take the last N tokens worth of sentences
      const overlapChunk: string[] = [];
      let overlapTokensCount = 0;
      for (let i = currentChunk.length - 1; i >= 0; i--) {
        const tokens = estimateTokens(currentChunk[i]);
        if (overlapTokensCount + tokens > overlapTokens) break;
        overlapChunk.unshift(currentChunk[i]);
        overlapTokensCount += tokens;
      }

      currentChunk = overlapChunk;
      currentTokens = overlapTokensCount;
    }

    currentChunk.push(sentence);
    currentTokens += sentenceTokens;
  }

  // Flush remaining
  if (currentChunk.length > 0) {
    chunks.push({
      content: currentChunk.join(" "),
      chunk_index: chunkIndex,
      page_number: pageNumber,
      metadata: {
        source: sourceFilename,
        page: pageNumber ?? undefined,
        chunk: chunkIndex,
      },
    });
  }

  return chunks;
}

/**
 * Chunk multi-page text (e.g., from a PDF with page breaks).
 * Each page is chunked separately to preserve page boundaries.
 */
export function chunkPages(
  pages: { text: string; pageNumber: number }[],
  sourceFilename: string,
  options: ChunkOptions = {}
): Chunk[] {
  const allChunks: Chunk[] = [];

  for (const page of pages) {
    if (!page.text.trim()) continue;

    const pageChunks = chunkText(
      page.text,
      sourceFilename,
      page.pageNumber,
      options
    );

    allChunks.push(...pageChunks);
  }

  // Re-index globally
  return allChunks.map((chunk, i) => ({
    ...chunk,
    chunk_index: i,
    metadata: { ...chunk.metadata, chunk: i },
  }));
}
