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

async function extractPdfText(buffer: Buffer): Promise<{ text: string; pages: Array<{ pageNumber: number; text: string }> }> {
  await ensurePdfParseEnvironment();
  const { PDFParse } = await import('pdf-parse');
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    const pages = result.pages.map((page) => ({
      pageNumber: page.num,
      text: page.text,
    }));
    return { text: result.text, pages };
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
): Promise<{ text: string; pages?: Array<{ pageNumber: number; text: string }> }> {
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