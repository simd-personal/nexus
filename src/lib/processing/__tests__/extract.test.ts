import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  extractTextFromBuffer,
  IMAGE_MIN_EXTRACTED_CHARS,
  isInsubstantialExtractedText,
  isPdfPageMarkerText,
  needsPdfOcrFallback,
  parseEmailBody,
  parseEmailMetadata,
  PDF_MIN_CHARS_PER_PAGE,
  stripPdfPageMarkers,
} from '@/lib/processing/extract';

vi.mock('@/lib/ai/openai', () => ({
  extractTextFromImage: vi.fn().mockResolvedValue('Slide title: Q3 revenue up 12 percent'),
}));

describe('isInsubstantialExtractedText', () => {
  it('treats short markdown notes as insubstantial', () => {
    expect(isInsubstantialExtractedText('Quick note')).toBe(true);
  });

  it('accepts short OCR text from photos', () => {
    const slideTitle = 'Slide headline: Revenue up 12 percent';
    expect(slideTitle.length).toBeLessThan(80);
    expect(isInsubstantialExtractedText(slideTitle, undefined, { image: true })).toBe(false);
  });

  it('rejects nearly empty photo OCR', () => {
    expect(isInsubstantialExtractedText('Hi', undefined, { image: true })).toBe(true);
    expect(
      isInsubstantialExtractedText('a'.repeat(IMAGE_MIN_EXTRACTED_CHARS), undefined, {
        image: true,
      })
    ).toBe(false);
  });
});

describe('pdf page marker detection', () => {
  it('detects pdf page marker boilerplate as non-substantive', () => {
    const markers = Array.from({ length: 21 }, (_, index) => `-- ${index + 1} of 21 --`).join('\n');
    expect(isPdfPageMarkerText(markers)).toBe(true);
    expect(isInsubstantialExtractedText(markers, 21)).toBe(true);
    expect(stripPdfPageMarkers(markers)).toBe('');
  });

  it('requests OCR when only page markers are present', () => {
    const pages = Array.from({ length: 21 }, (_, index) => ({
      pageNumber: index + 1,
      text: '',
    }));
    const markers = pages.map((page) => `-- ${page.pageNumber} of 21 --`).join('\n');
    expect(needsPdfOcrFallback(markers, pages)).toBe(true);
  });
});

describe('needsPdfOcrFallback', () => {
  it('requests OCR when native PDF text is empty', () => {
    const pages = Array.from({ length: 21 }, (_, index) => ({
      pageNumber: index + 1,
      text: '',
    }));
    expect(needsPdfOcrFallback('\n\n', pages)).toBe(true);
  });

  it('requests OCR when extracted text is too sparse for the page count', () => {
    const pages = Array.from({ length: 21 }, (_, index) => ({
      pageNumber: index + 1,
      text: 'footer',
    }));
    expect(needsPdfOcrFallback('footer '.repeat(21), pages)).toBe(true);
    expect(PDF_MIN_CHARS_PER_PAGE).toBeGreaterThan(1);
  });

  it('skips OCR for text-heavy PDFs', () => {
    const pages = [{ pageNumber: 1, text: 'A'.repeat(500) }];
    expect(needsPdfOcrFallback('A'.repeat(500), pages)).toBe(false);
  });
});

describe('extractTextFromBuffer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reads markdown files as utf-8 text', async () => {
    const md = '# Notes\n\nDenver approved for Q4.';
    const { text } = await extractTextFromBuffer(Buffer.from(md), 'notes.md', 'text/markdown');
    expect(text).toBe(md);
  });

  it('reads .markdown extension', async () => {
    const { text } = await extractTextFromBuffer(
      Buffer.from('Hello world'),
      'readme.markdown'
    );
    expect(text).toBe('Hello world');
  });

  it('strips VTT timing lines from transcripts', async () => {
    const vtt = `WEBVTT

00:00:01.000 --> 00:00:04.000
James Wright: Board is aligned on expansion.

00:00:05.000 --> 00:00:08.000
Maria Santos: Vendor plan due July 15.`;
    const { text } = await extractTextFromBuffer(Buffer.from(vtt), 'call.vtt');
    expect(text).toContain('James Wright: Board is aligned');
    expect(text).not.toContain('-->');
    expect(text).not.toContain('WEBVTT');
  });

  it('delegates image files to vision extraction', async () => {
    const { extractTextFromImage } = await import('@/lib/ai/openai');
    const { text } = await extractTextFromBuffer(
      Buffer.from('fake-png'),
      'slide.png',
      'image/png'
    );
    expect(extractTextFromImage).toHaveBeenCalledOnce();
    expect(text).toContain('Q3 revenue');
  });

  it('extracts spreadsheet rows from xlsx files', async () => {
    const XLSX = await import('xlsx');
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([
      ['Owner', 'Action'],
      ['Revenue Cycle', 'Review denials queue'],
    ]);
    XLSX.utils.book_append_sheet(workbook, sheet, 'Actions');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;

    const { text } = await extractTextFromBuffer(buffer, 'plan.xlsx');
    expect(text).toContain('Sheet: Actions');
    expect(text).toContain('Review denials queue');
  });
});

describe('email parsing', () => {
  it('extracts email headers', () => {
    const eml = `From: sarah@acme.com
To: team@client.com
Date: Mon, 1 Jan 2025 10:00:00 -0800
Subject: Q3 follow up

Body line one.`;
    expect(parseEmailMetadata(eml)).toMatchObject({
      sender: 'sarah@acme.com',
      subject: 'Q3 follow up',
    });
    expect(parseEmailBody(eml)).toContain('Body line one');
  });
});
