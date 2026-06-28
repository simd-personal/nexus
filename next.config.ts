import type { NextConfig } from 'next';

const pdfJsWorkerIncludes = [
  './node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs',
  './node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs',
  './node_modules/pdfjs-dist/legacy/build/pdf.mjs',
];

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdf-parse', 'pdfjs-dist', 'mammoth', '@napi-rs/canvas'],
  outputFileTracingIncludes: {
    '/api/files/*/process': pdfJsWorkerIncludes,
    '/api/files/*/reprocess': pdfJsWorkerIncludes,
    '/api/upload': pdfJsWorkerIncludes,
  },
};

export default nextConfig;
