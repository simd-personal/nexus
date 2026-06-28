import { existsSync } from 'fs';
import { createRequire } from 'module';
import { join } from 'path';
import { pathToFileURL } from 'url';

/**
 * pdf-parse v2 pulls in pdfjs, which expects DOMMatrix and optionally @napi-rs/canvas.
 * On Vercel, pdfjs also needs an explicit worker file URL — the default relative import
 * is not always present in serverless traces.
 *
 * Do not use createRequire(import.meta.url) here: Next.js server bundles can pass a
 * numeric module id instead of a file URL, which breaks worker resolution on Vercel.
 */
let pdfEnvironmentReady: Promise<void> | null = null;

export function resolvePdfWorkerUrl(): string {
  const workerCandidates = [
    join(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs'),
    join(
      process.cwd(),
      'node_modules/pdf-parse/node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs'
    ),
  ];

  for (const candidate of workerCandidates) {
    if (existsSync(candidate)) {
      return pathToFileURL(candidate).href;
    }
  }

  const require = createRequire(join(process.cwd(), 'package.json'));
  const workerPath = require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs');
  return pathToFileURL(workerPath).href;
}

export async function ensurePdfParseEnvironment(): Promise<void> {
  if (!pdfEnvironmentReady) {
    pdfEnvironmentReady = (async () => {
      if (typeof globalThis.DOMMatrix === 'undefined') {
        try {
          const canvas = await import('@napi-rs/canvas');
          if (canvas.DOMMatrix) {
            globalThis.DOMMatrix = canvas.DOMMatrix as typeof DOMMatrix;
          }
        } catch {
          // pdf-parse will attempt its own polyfill path when canvas is unavailable
        }
      }

      const { PDFParse } = await import('pdf-parse');
      PDFParse.setWorker(resolvePdfWorkerUrl());
    })();
  }

  await pdfEnvironmentReady;
}
