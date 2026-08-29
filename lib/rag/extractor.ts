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

export async function extractPdf(buffer: Buffer): Promise<ExtractionResult> {
  const data = await pdfParse(buffer);

  const raw: string[] = data.text.split(/\f/);

  const pg: ExtractedPage[] = [];
  for (let i = 0; i < raw.length; i++) {
    const line = raw[i].trim();
    if (line.length > 0) pg.push({ text: line, pageNumber: i + 1 });
  }

  return {
    pages: pg,
    fullText: data.text,
    pageCount: data.numpages || pg.length,
  };
}

export async function extractPptx(buffer: Buffer): Promise<ExtractionResult> {
  const zipLib = (await import("jszip")).default;
  const zip = await zipLib.loadAsync(buffer);

  const slides: ExtractedPage[] = [];
  const slideNames = Object.keys(zip.files)
    .filter((name) => name.match(/^ppt\/slides\/slide\d+\.xml$/))
    .sort();

  for (let i = 0; i < slideNames.length; i++) {
    const slideXml = await zip.files[slideNames[i]].async("text");

    const m = slideXml.match(/<a:t[^>]*>([^<]+)<\/a:t>/g) || [];
    const bits: string[] = [];
    for (let j = 0; j < m.length; j++) {
      const cell = m[j].replace(/<[^>]+>/g, "").trim();
      if (cell.length > 0) bits.push(cell);
    }
    const text = bits.join(" ");

    if (text.trim()) {
      slides.push({ text: text.trim(), pageNumber: i + 1 });
    }
  }

  let fullText = "";
  for (let i = 0; i < slides.length; i++) {
    if (i > 0) {
      fullText += "\n\n";
    }
    fullText += slides[i].text;
  }

  return {
    pages: slides,
    fullText,
    pageCount: slides.length,
  };
}

export async function extractText(
  buffer: Buffer,
  fileType: string,
): Promise<ExtractionResult> {
  switch (fileType.toUpperCase()) {
    case "PDF":
      return extractPdf(buffer);
    case "PPTX":
      return extractPptx(buffer);
    default:
      return {
        pages: [{ text: "", pageNumber: 1 }],
        fullText: "",
        pageCount: 0,
      };
  }
}
