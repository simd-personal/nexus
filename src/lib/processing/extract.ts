import mammoth from 'mammoth';
import { extractTextFromImage } from '@/lib/ai/openai';
import { getFileExtension, IMAGE_EXTENSIONS, TRANSCRIPT_EXTENSIONS } from '@/lib/constants';
import { ensurePdfParseEnvironment } from '@/lib/processing/pdf-env';
import { extractSpreadsheetText } from '@/lib/processing/spreadsheet';

function mimeForExtension(ext: string): string {
  switch (ext) {
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.webp':
      return 'image/webp';
    default:
      return 'application/octet-stream';
  }
}

/** Scanned PDFs often yield far less text than a real document per page. */
export const PDF_MIN_CHARS_PER_PAGE = 40;
/** Photos often contain short labels, titles, or sticky-note text. */
export const IMAGE_MIN_EXTRACTED_CHARS = 8;
export const PDF_PAGE_MARKER_RE = /--\s*\d+\s+of\s+\d+\s*--/gi;
const PDF_OCR_SCALE = 1.5;
const PDF_OCR_CONCURRENCY = 3;

export function stripPdfPageMarkers(text: string): string {
  return text.replace(PDF_PAGE_MARKER_RE, ' ').replace(/\s+/g, ' ').trim();
}

export function isPdfPageMarkerText(text: string): boolean {
  if (!/--\s*\d+\s+of\s+\d+\s*--/i.test(text)) return false;
  return stripPdfPageMarkers(text).length < 40;
}

export function isInsubstantialExtractedText(
  text: string,
  pageCount?: number,
  options?: { image?: boolean }
): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;
  if (isPdfPageMarkerText(trimmed)) return true;

  const substantive = stripPdfPageMarkers(trimmed);
  if (!substantive) return true;
  if (pageCount && pageCount > 0) {
    return substantive.length < pageCount * PDF_MIN_CHARS_PER_PAGE;
  }
  if (options?.image) {
    return substantive.length < IMAGE_MIN_EXTRACTED_CHARS;
  }
  return substantive.length < 80;
}

export function needsPdfOcrFallback(
  text: string,
  pages: Array<{ pageNumber: number; text: string }>
): boolean {
  if (isPdfPageMarkerText(text)) return true;

  const pageCount = pages.length;
  const trimmed = text.trim();
  if (pageCount === 0) return !trimmed;
  if (!trimmed) return true;

  const pagesWithText = pages.filter((page) => page.text.trim().length > 0).length;
  if (pagesWithText === 0) return true;

  return stripPdfPageMarkers(trimmed).length < pageCount * PDF_MIN_CHARS_PER_PAGE;
}

async function ocrPdfPages(
  parser: { getScreenshot: (params: Record<string, unknown>) => Promise<{ pages: Array<{ pageNumber: number; data?: Uint8Array }> }> },
  pageNumbers: number[]
): Promise<Array<{ pageNumber: number; text: string }>> {
  const results: Array<{ pageNumber: number; text: string }> = [];

  for (let i = 0; i < pageNumbers.length; i += PDF_OCR_CONCURRENCY) {
    const batch = pageNumbers.slice(i, i + PDF_OCR_CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map(async (pageNumber) => {
        const shot = await parser.getScreenshot({
          partial: [pageNumber],
          scale: PDF_OCR_SCALE,
          imageBuffer: true,
        });
        const page = shot.pages.find((entry) => entry.pageNumber === pageNumber) ?? shot.pages[0];
        if (!page?.data?.length) {
          return { pageNumber, text: '' };
        }
        const text = await extractTextFromImage(Buffer.from(page.data), 'image/png');
        return { pageNumber, text };
      })
    );
    results.push(...batchResults);
  }

  return results.sort((a, b) => a.pageNumber - b.pageNumber);
}

async function extractPdfText(
  buffer: Buffer
): Promise<{
  text: string;
  pages: Array<{ pageNumber: number; text: string }>;
  ocrExtracted: boolean;
}> {
  await ensurePdfParseEnvironment();
  const { PDFParse } = await import('pdf-parse');
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    let pages = result.pages.map((page) => ({
      pageNumber: page.num,
      text: page.text,
    }));

    if (!needsPdfOcrFallback(result.text, pages)) {
      return { text: result.text, pages, ocrExtracted: false };
    }

    const pageNumbers =
      pages.length > 0
        ? pages.map((page) => page.pageNumber)
        : Array.from({ length: result.total }, (_, index) => index + 1);

    pages = await ocrPdfPages(parser, pageNumbers);
    const text = pages
      .map((page) => page.text.trim())
      .filter(Boolean)
      .join('\n\n');

    return { text, pages, ocrExtracted: true };
  } finally {
    await parser.destroy();
  }
}

function parseTranscriptText(text: string): string {
  return text
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return false;
      if (/^\d+$/.test(trimmed)) return false;
      if (/^\d{2}:\d{2}:\d{2}[,.]\d{3}\s-->/.test(trimmed)) return false;
      if (/^\d{2}:\d{2}[,.]\d{2}\s-->/.test(trimmed)) return false;
      if (/^WEBVTT/i.test(trimmed)) return false;
      if (/^NOTE\b/i.test(trimmed)) return false;
      return true;
    })
    .join('\n')
    .trim();
}

export async function extractTextFromBuffer(
  buffer: Buffer,
  fileName: string,
  mimeType?: string
): Promise<{
  text: string;
  pages?: Array<{ pageNumber: number; text: string }>;
  ocrExtracted?: boolean;
}> {
  const ext = getFileExtension(fileName);

  if (IMAGE_EXTENSIONS.includes(ext)) {
    const text = await extractTextFromImage(buffer, mimeType ?? mimeForExtension(ext));
    return { text };
  }

  switch (ext) {
    case '.txt':
    case '.md':
    case '.markdown':
    case '.csv':
      return { text: buffer.toString('utf-8') };

    case '.eml':
      return { text: buffer.toString('utf-8') };

    case '.xlsx':
    case '.xls':
      return { text: await extractSpreadsheetText(buffer) };

    case '.vtt':
    case '.srt':
      return { text: parseTranscriptText(buffer.toString('utf-8')) };

    case '.pdf': {
      const pdf = await extractPdfText(buffer);
      return {
        text: pdf.text,
        pages: pdf.pages.length ? pdf.pages : [{ pageNumber: 1, text: pdf.text }],
        ocrExtracted: pdf.ocrExtracted,
      };
    }

    case '.docx': {
      const result = await mammoth.extractRawText({ buffer });
      return { text: result.value };
    }

    default:
      if (mimeType?.startsWith('text/')) {
        const text = buffer.toString('utf-8');
        return {
          text: TRANSCRIPT_EXTENSIONS.includes(ext) ? parseTranscriptText(text) : text,
        };
      }
      if (mimeType?.startsWith('image/')) {
        const text = await extractTextFromImage(buffer, mimeType);
        return { text };
      }
      return { text: '' };
  }
}

export function parseEmailMetadata(text: string): Record<string, string> {
  const metadata: Record<string, string> = {};
  const fromMatch = text.match(/^From:\s*(.+)$/m);
  const toMatch = text.match(/^To:\s*(.+)$/m);
  const dateMatch = text.match(/^Date:\s*(.+)$/m);
  const subjectMatch = text.match(/^Subject:\s*(.+)$/m);

  if (fromMatch) metadata.sender = fromMatch[1].trim();
  if (toMatch) metadata.recipient = toMatch[1].trim();
  if (dateMatch) metadata.date = dateMatch[1].trim();
  if (subjectMatch) metadata.subject = subjectMatch[1].trim();

  return metadata;
}

export function parseEmailBody(text: string): string {
  const bodyStart = text.search(/\n\n/);
  return bodyStart >= 0 ? text.slice(bodyStart).trim() : text;
}