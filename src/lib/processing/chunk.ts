const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;

export interface TextChunk {
  text: string;
  index: number;
  metadata: Record<string, unknown>;
}

export function chunkText(
  text: string,
  baseMetadata: Record<string, unknown> = {}
): TextChunk[] {
  if (!text.trim()) return [];

  const chunks: TextChunk[] = [];
  let start = 0;
  let index = 0;

  while (start < text.length) {
    let end = start + CHUNK_SIZE;

    if (end < text.length) {
      const breakPoints = ['\n\n', '\n', '. ', ' '];
      for (const bp of breakPoints) {
        const lastBreak = text.lastIndexOf(bp, end);
        if (lastBreak > start + CHUNK_SIZE / 2) {
          end = lastBreak + bp.length;
          break;
        }
      }
    }

    const chunkText = text.slice(start, end).trim();
    if (chunkText) {
      chunks.push({
        text: chunkText,
        index,
        metadata: { ...baseMetadata, char_start: start, char_end: end },
      });
      index++;
    }

    start = end - CHUNK_OVERLAP;
    if (start >= text.length) break;
  }

  return chunks;
}

export function chunkByPages(
  pages: Array<{ pageNumber: number; text: string }>,
  baseMetadata: Record<string, unknown> = {}
): TextChunk[] {
  const allChunks: TextChunk[] = [];
  let globalIndex = 0;

  for (const page of pages) {
    const pageChunks = chunkText(page.text, {
      ...baseMetadata,
      page_number: page.pageNumber,
    });
    for (const chunk of pageChunks) {
      allChunks.push({ ...chunk, index: globalIndex++ });
    }
  }

  return allChunks;
}

export function chunkBySheets(
  sheets: Array<{ name: string; rows: string[][] }>,
  baseMetadata: Record<string, unknown> = {}
): TextChunk[] {
  const allChunks: TextChunk[] = [];
  let globalIndex = 0;

  for (const sheet of sheets) {
    const lines = sheet.rows
      .map((row) => row.filter(Boolean).join(' | '))
      .filter(Boolean);
    const sheetText = lines.join('\n');
    const sheetChunks = chunkText(sheetText, {
      ...baseMetadata,
      sheet_name: sheet.name,
    });
    for (const chunk of sheetChunks) {
      allChunks.push({ ...chunk, index: globalIndex++ });
    }
  }

  return allChunks;
}
