/**
 * Local PDF extraction smoke test.
 * Usage: npx tsx scripts/test-local-pdf.ts path/to/file.pdf
 */

import { config } from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { extractTextFromBuffer, needsPdfOcrFallback } from '../src/lib/processing/extract';
import { ensurePdfParseEnvironment } from '../src/lib/processing/pdf-env';

config({ path: resolve(process.cwd(), '.env.local') });

async function inspectNativePdf(buffer: Buffer) {
  await ensurePdfParseEnvironment();
  const { PDFParse } = await import('pdf-parse');
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    const pages = result.pages.map((page) => ({ pageNumber: page.num, text: page.text }));
    return {
      pageCount: result.total,
      nativeChars: result.text.trim().length,
      pagesWithText: pages.filter((page) => page.text.trim()).length,
      needsOcr: needsPdfOcrFallback(result.text, pages),
      nativePreview: result.text.trim().slice(0, 240),
    };
  } finally {
    await parser.destroy();
  }
}

async function main() {
  const pdfPath = process.argv[2];
  if (!pdfPath) {
    console.error('Usage: npx tsx scripts/test-local-pdf.ts path/to/file.pdf');
    process.exit(1);
  }
  if (!existsSync(pdfPath)) {
    console.error(`File not found: ${pdfPath}`);
    process.exit(1);
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY required in .env.local for OCR fallback');
    process.exit(1);
  }

  const buffer = readFileSync(pdfPath);
  const fileName = pdfPath.split('/').pop() ?? 'document.pdf';

  console.log(`Testing: ${fileName}`);
  console.log(`Size: ${(buffer.length / 1024).toFixed(1)} KB\n`);

  console.log('--- Native PDF text ---');
  const native = await inspectNativePdf(buffer);
  console.log(`Pages: ${native.pageCount}`);
  console.log(`Native chars: ${native.nativeChars}`);
  console.log(`Pages with native text: ${native.pagesWithText}/${native.pageCount}`);
  console.log(`OCR fallback needed: ${native.needsOcr}`);
  if (native.nativePreview) {
    console.log(`Native preview: ${native.nativePreview.replace(/\s+/g, ' ')}`);
  }

  console.log('\n--- Full extraction (with OCR if needed) ---');
  const started = Date.now();
  const { text, pages, ocrExtracted } = await extractTextFromBuffer(
    buffer,
    fileName,
    'application/pdf'
  );
  const elapsedSec = ((Date.now() - started) / 1000).toFixed(1);

  const pageCount = pages?.length ?? 0;
  const pagesWithText = pages?.filter((page) => page.text.trim()).length ?? 0;

  console.log(`Elapsed: ${elapsedSec}s`);
  console.log(`OCR used: ${ocrExtracted ? 'yes' : 'no'}`);
  console.log(`Extracted chars: ${text.trim().length}`);
  console.log(`Pages with extracted text: ${pagesWithText}/${pageCount}`);

  if (!text.trim()) {
    console.error('\nFAIL: no text extracted');
    process.exit(1);
  }

  console.log(`\nPreview:\n${text.trim().slice(0, 800).replace(/\s+/g, ' ')}...`);
  console.log('\nPASS: file is readable after extraction');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
