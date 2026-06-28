import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import { ensurePdfParseEnvironment, resolvePdfWorkerUrl } from '@/lib/processing/pdf-env';

describe('pdf-env', () => {
  it('resolves the pdfjs worker module on disk', () => {
    const workerUrl = resolvePdfWorkerUrl();
    expect(workerUrl).toMatch(/pdf\.worker\.mjs$/);
  });

  it('extracts text from a sample pdf after worker setup', async () => {
    await ensurePdfParseEnvironment();
    const { PDFParse } = await import('pdf-parse');
    const samplePath = join(process.cwd(), 'scripts/fixtures/sample-document.pdf');
    const parser = new PDFParse({ data: readFileSync(samplePath) });
    try {
      const result = await parser.getText();
      expect(result.text.length).toBeGreaterThan(0);
      expect(result.pages.length).toBeGreaterThan(0);
    } finally {
      await parser.destroy();
    }
  });
});
