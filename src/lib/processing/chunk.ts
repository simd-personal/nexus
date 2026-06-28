import type { ChunkConfig } from '@/lib/processing/large-file';

const DEFAULT_CHUNK_SIZE = 1000;
const DEFAULT_OVERLAP = 200;
const DEFAULT_ROWS_PER_SHEET_CHUNK = 35;

export interface TextChunk {
  text: string;
  index: number;
  metadata: Record<string, unknown>;
}

export function chunkText(
  text: string,
  baseMetadata: Record<string, unknown> = {},
  config?: Pick<ChunkConfig, 'chunkSize' | 'overlap'>
): TextChunk[] {
  if (!text.trim()) return [];

  const chunkSize = config?.chunkSize ?? DEFAULT_CHUNK_SIZE;
  const overlap = config?.overlap ?? DEFAULT_OVERLAP;
  const chunks: TextChunk[] = [];
  let start = 0;
  let index = 0;

  while (start < text.length) {
    let end = start + chunkSize;

    if (end < text.length) {
      const breakPoints = ['\n\n', '\n', '. ', ' '];
      for (const bp of breakPoints) {
        const lastBreak = text.lastIndexOf(bp, end);
        if (lastBreak > start + chunkSize / 2) {
          end = lastBreak + bp.length;
          break;
        }
      }
    }

    const slice = text.slice(start, end).trim();
    if (slice) {
      chunks.push({
        text: slice,
        index,
        metadata: { ...baseMetadata, char_start: start, char_end: end },
      });
      index++;
    }

    start = end - overlap;
    if (start >= text.length) break;
  }

  return chunks;
}

export function chunkByPages(
  pages: Array<{ pageNumber: number; text: string }>,
  baseMetadata: Record<string, unknown> = {},
  config?: Pick<ChunkConfig, 'chunkSize' | 'overlap'>
): TextChunk[] {
  const allChunks: TextChunk[] = [];
  let globalIndex = 0;

  for (const page of pages) {
    const pageChunks = chunkText(
      page.text,
      { ...baseMetadata, page_number: page.pageNumber },
      config
    );
    for (const chunk of pageChunks) {
      allChunks.push({ ...chunk, index: globalIndex++ });
    }
  }

  return allChunks;
}

export function chunkBySheets(
  sheets: Array<{ name: string; rows: string[][] }>,
  baseMetadata: Record<string, unknown> = {},
  rowsPerChunk = DEFAULT_ROWS_PER_SHEET_CHUNK
): TextChunk[] {
  const allChunks: TextChunk[] = [];
  let globalIndex = 0;

  for (const sheet of sheets) {
    const rows = sheet.rows.filter((row) => row.some(Boolean));
    if (rows.length === 0) continue;

    for (let start = 0; start < rows.length; start += rowsPerChunk) {
      const batch = rows.slice(start, start + rowsPerChunk);
      const lines = batch.map((row) => formatSpreadsheetRow(row)).filter(Boolean);
      if (lines.length === 0) continue;

      allChunks.push({
        text: `Sheet: ${sheet.name}\n${lines.join('\n')}`,
        index: globalIndex,
        metadata: {
          ...baseMetadata,
          sheet_name: sheet.name,
          row_start: start + 1,
          row_end: start + batch.length,
        },
      });
      globalIndex++;
    }
  }

  return allChunks;
}

function formatSpreadsheetRow(row: string[]): string {
  return row.filter(Boolean).join(' | ');
}
