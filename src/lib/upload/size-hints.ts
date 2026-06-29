export type UploadSizeTier = 'normal' | 'large' | 'very_large';

/** Single upload at or above this size may take noticeably longer to index. */
export const LARGE_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

/** Very large uploads often need multiple background processing passes. */
export const VERY_LARGE_UPLOAD_BYTES = 50 * 1024 * 1024; // 50 MB

export function getUploadSizeTier(byteSize: number): UploadSizeTier {
  if (byteSize >= VERY_LARGE_UPLOAD_BYTES) return 'very_large';
  if (byteSize >= LARGE_UPLOAD_BYTES) return 'large';
  return 'normal';
}

export function uploadSizeHint(tier: UploadSizeTier): string | null {
  switch (tier) {
    case 'large':
      return 'Large file — indexing may take a few minutes. Sunny keeps working in the background.';
    case 'very_large':
      return 'Very large file — indexing can take several minutes. You can keep using UpperDeck while Sunny works.';
    default:
      return null;
  }
}

export function buildUploadSizeMetadata(byteSize: number): Record<string, unknown> {
  const tier = getUploadSizeTier(byteSize);
  return {
    byte_size: byteSize,
    size_tier: tier,
    ...(tier !== 'normal' ? { size_hint: uploadSizeHint(tier) } : {}),
  };
}

export function maxUploadSizeTier(byteSizes: number[]): UploadSizeTier {
  if (byteSizes.length === 0) return 'normal';
  return byteSizes.reduce<UploadSizeTier>(
    (max, size) => {
      const tier = getUploadSizeTier(size);
      if (tier === 'very_large') return 'very_large';
      if (tier === 'large' && max !== 'very_large') return 'large';
      return max;
    },
    'normal'
  );
}
