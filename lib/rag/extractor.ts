// @ts-expect-error - pdf-parse v1 has no type declarations
import pdfParse from "pdf-parse/lib/pdf-parse";

export interface ExtractedPage {
  text: string;
  pageNumber: number;
}

export interface ExtractionResult {
  pages: ExtractedPage[];
  fullText: string;
  pageCount: number;
}

/**
 * Extract text from a PDF buffer.
 * Returns per-page text for page-aware chunking.
 */
export async function extractPdf(buffer: Buffer): Promise<ExtractionResult> {
  const data = await pdfParse(buffer);

  // pdf-parse doesn't give per-page text in the free version.
  // We split on form-feed characters (ASCII 12) which separate pages.
  const rawPages: string[] = data.text.split(/\f/);

  const pages: ExtractedPage[] = rawPages
    .map((text, i) => ({
      text: text.trim(),
      pageNumber: i + 1,
    }))
    .filter((p) => p.text.length > 0);

  return {
    pages,
    fullText: data.text,
    pageCount: data.numpages || pages.length,
  };
}

/**
 * Extract text from a PPTX file.
 * PPTX is a ZIP containing XML files. We extract text from slide XML.
 */
export async function extractPptx(buffer: Buffer): Promise<ExtractionResult> {
  // Dynamic import to avoid bundling JSZip on the client
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(buffer);

  const slides: ExtractedPage[] = [];
  const slideFiles = Object.keys(zip.files)
    .filter((name) => name.match(/^ppt\/slides\/slide\d+\.xml$/))
    .sort();

  for (let i = 0; i < slideFiles.length; i++) {
    const xml = await zip.files[slideFiles[i]].async("text");

    // Extract text content from XML <a:t> tags (PowerPoint text runs)
    const textMatches = xml.match(/<a:t[^>]*>([^<]+)<\/a:t>/g) || [];
    const text = textMatches
      .map((m) => m.replace(/<[^>]+>/g, "").trim())
      .filter((t) => t.length > 0)
      .join(" ");

    if (text.trim()) {
      slides.push({
        text: text.trim(),
        pageNumber: i + 1,
      });
    }
  }

  const fullText = slides.map((s) => s.text).join("\n\n");

  return {
    pages: slides,
    fullText,
    pageCount: slides.length,
  };
}

/**
 * Main extraction dispatcher. Routes to the right extractor based on file type.
 */
export async function extractText(
  buffer: Buffer,
  fileType: string
): Promise<ExtractionResult> {
  switch (fileType.toUpperCase()) {
    case "PDF":
      return extractPdf(buffer);

    case "PPTX":
      return extractPptx(buffer);

    default:
      // For unsupported types (images, etc.), return empty for now.
      // OCR support can be added later.
      return {
        pages: [{ text: "", pageNumber: 1 }],
        fullText: "",
        pageCount: 0,
      };
  }
}
