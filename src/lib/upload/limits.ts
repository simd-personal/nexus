export const MAX_SINGLE_UPLOAD_BYTES = 200 * 1024 * 1024; // 200 MB
export const MAX_ZIP_UPLOAD_BYTES = 200 * 1024 * 1024;
export const MAX_PASTED_TEXT_BYTES = 2 * 1024 * 1024; // 2 MB

export const UPLOAD_RATE_LIMIT_FREE = { max: 30, windowSec: 3600 };
export const UPLOAD_RATE_LIMIT_PRO = { max: 120, windowSec: 3600 };

export type UploadSizeKind = 'file' | 'zip' | 'paste';

export function maxBytesForUploadKind(kind: UploadSizeKind): number {
  switch (kind) {
    case 'zip':
      return MAX_ZIP_UPLOAD_BYTES;
    case 'paste':
      return MAX_PASTED_TEXT_BYTES;
    default:
      return MAX_SINGLE_UPLOAD_BYTES;
  }
}

export function formatMaxUploadSize(kind: UploadSizeKind = 'file'): string {
  const mb = Math.round(maxBytesForUploadKind(kind) / (1024 * 1024));
  return `${mb} MB`;
}

export function validateUploadByteSize(
  byteSize: number,
  kind: UploadSizeKind
): { ok: true } | { ok: false; error: string } {
  const max = maxBytesForUploadKind(kind);
  if (byteSize <= max) return { ok: true };

  const label = kind === 'paste' ? 'Pasted text' : 'This file';
  return {
    ok: false,
    error: `${label} is too large (max ${formatMaxUploadSize(kind)}). Split or compress and try again.`,
  };
}

export function uploadRateLimitForPro(isPro: boolean) {
  return isPro ? UPLOAD_RATE_LIMIT_PRO : UPLOAD_RATE_LIMIT_FREE;
}
