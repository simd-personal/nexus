import type { NextConfig } from 'next';

const pdfJsWorkerIncludes = [
  './node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs',
  './node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs',
  './node_modules/pdfjs-dist/legacy/build/pdf.mjs',
];

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdf-parse', 'pdfjs-dist', 'mammoth', '@napi-rs/canvas'],
  experimental: {
    serverActions: {
      bodySizeLimit: '6mb',
    },
  },
  outputFileTracingIncludes: {
    '/api/files/*/process': pdfJsWorkerIncludes,
    '/api/files/*/reprocess': pdfJsWorkerIncludes,
    '/api/upload': pdfJsWorkerIncludes,
  },
  async headers() {
    const noStore = [
      { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
      { key: 'Pragma', value: 'no-cache' },
      { key: 'Expires', value: '0' },
      { key: 'CDN-Cache-Control', value: 'no-store' },
      { key: 'Vercel-CDN-Cache-Control', value: 'no-store' },
    ];
    return [
      { source: '/login', headers: noStore },
      { source: '/login/:path*', headers: noStore },
      { source: '/auth/:path*', headers: noStore },
      { source: '/api/auth/:path*', headers: noStore },
    ];
  },
};

export default nextConfig;
