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
  maxTokens?: number;
  overlapTokens?: number;
}

const defaults: ChunkOptions = {
  maxTokens: 600,
  overlapTokens: 100,
};

function guessTok(t: string): number {
  return Math.ceil(t.length / 4);
}

function breakSentences(text: string): string[] {
  const cl = text.replace(/\n{2,}/g, "|||PARA|||");
  const parts = cl.split(/(?<=[.!?])\s+(?=[A-Z\d"'\(])/);
  const sent: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    const piece = parts[i].replace(/\|\|\|PARA\|\|\|/g, "\n\n").trim();
    if (piece.length > 0) sent.push(piece);
  }
  return sent;
}

export function chunkText(
  text: string,
  srcName: string,
  pageNumber: number | null,
  options: ChunkOptions = {}
): Chunk[] {
  const { maxTokens = 600, overlapTokens = 100 } = { ...defaults, ...options };

  const sentences = breakSentences(text);
  const chunks: Chunk[] = [];
  let cur: string[] = [];
  let curT = 0;
  let ix = 0;

  for (const s of sentences) {
    const st = guessTok(s);

    if (curT + st > maxTokens && cur.length > 0) {
      chunks.push({
        content: cur.join(" "),
        chunk_index: ix,
        page_number: pageNumber,
        metadata: {
          source: srcName,
          page: pageNumber ?? undefined,
          chunk: ix,
        },
      });
      ix++;

      const ov: string[] = [];
      let ovT = 0;
      for (let i = cur.length - 1; i >= 0; i--) {
        const tokens = guessTok(cur[i]);
        if (ovT + tokens > overlapTokens) break;
        ov.unshift(cur[i]);
        ovT += tokens;
      }

      cur = ov;
      curT = ovT;
    }

    cur.push(s);
    curT += st;
  }

  if (cur.length > 0) {
    chunks.push({
      content: cur.join(" "),
      chunk_index: ix,
      page_number: pageNumber,
      metadata: {
        source: srcName,
        page: pageNumber ?? undefined,
        chunk: ix,
      },
    });
  }

  return chunks;
}

export function chunkPages(
  pages: { text: string; pageNumber: number }[],
  srcName: string,
  options: ChunkOptions = {}
): Chunk[] {
  const allChunks: Chunk[] = [];

  for (const pg of pages) {
    if (!pg.text.trim()) continue;

    const pageChunks = chunkText(pg.text, srcName, pg.pageNumber, options);
    for (let i = 0; i < pageChunks.length; i++) {
      allChunks.push(pageChunks[i]);
    }
  }

  const reindexed: Chunk[] = [];
  for (let i = 0; i < allChunks.length; i++) {
    const chunk = allChunks[i];
    reindexed.push({ ...chunk, chunk_index: i, metadata: { ...chunk.metadata, chunk: i } });
  }
  return reindexed;
}
