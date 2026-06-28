/**
 * pdf-parse v2 pulls in pdfjs, which expects DOMMatrix and optionally @napi-rs/canvas.
 * Load lazily so /api/upload does not crash on cold start for non-PDF files.
 */
let pdfEnvironmentReady: Promise<void> | null = null;

export async function ensurePdfParseEnvironment(): Promise<void> {
  if (!pdfEnvironmentReady) {
    pdfEnvironmentReady = (async () => {
      if (typeof globalThis.DOMMatrix !== 'undefined') return;

      try {
        const canvas = await import('@napi-rs/canvas');
        if (canvas.DOMMatrix) {
          globalThis.DOMMatrix = canvas.DOMMatrix as typeof DOMMatrix;
        }
      } catch {
        // pdf-parse will attempt its own polyfill path when canvas is unavailable
      }
    })();
  }

  await pdfEnvironmentReady;
}
