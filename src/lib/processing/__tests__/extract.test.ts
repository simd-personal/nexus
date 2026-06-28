import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  extractTextFromBuffer,
  parseEmailBody,
  parseEmailMetadata,
} from '@/lib/processing/extract';

vi.mock('@/lib/ai/openai', () => ({
  extractTextFromImage: vi.fn().mockResolvedValue('Slide title: Q3 revenue up 12 percent'),
}));

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
