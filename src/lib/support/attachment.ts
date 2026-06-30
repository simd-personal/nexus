import { sanitizeUploadFileName } from '@/lib/upload/client';

export const SUPPORT_IMAGE_ACCEPT =
  'image/png,image/jpeg,image/jpg,image/webp,image/gif,image/heic,image/heif';

export const MAX_SUPPORT_ATTACHMENT_BYTES = 5 * 1024 * 1024;

export type SupportAttachment = {
  filename: string;
  contentType: string;
  buffer: Buffer;
};

const IMAGE_EXTENSIONS = /\.(png|jpe?g|webp|gif|heic|heif)$/i;

const ALLOWED_CONTENT_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
]);

export function isSupportImageFileName(fileName: string): boolean {
  return IMAGE_EXTENSIONS.test(fileName.trim());
}

export function isSupportImageContentType(contentType: string): boolean {
  const normalized = contentType.trim().toLowerCase();
  if (ALLOWED_CONTENT_TYPES.has(normalized)) return true;
  return normalized.startsWith('image/');
}

export type ParseSupportAttachmentResult =
  | { kind: 'none' }
  | { kind: 'error'; error: string }
  | { kind: 'ok'; attachment: SupportAttachment };

export async function parseSupportAttachmentFromFormValue(
  value: FormDataEntryValue | null
): Promise<ParseSupportAttachmentResult> {
  if (value == null) return { kind: 'none' };

  if (typeof value === 'string') {
    return value.trim() ? { kind: 'error', error: 'Invalid screenshot upload.' } : { kind: 'none' };
  }

  if (!(value instanceof File) || value.size === 0) {
    return { kind: 'none' };
  }

  const contentType = value.type.trim().toLowerCase() || 'application/octet-stream';
  const filename = sanitizeUploadFileName(value.name || 'screenshot.png');

  if (!isSupportImageContentType(contentType) && !isSupportImageFileName(filename)) {
    return {
      kind: 'error',
      error: 'Screenshots must be an image (PNG, JPG, WEBP, GIF, or HEIC).',
    };
  }

  if (value.size > MAX_SUPPORT_ATTACHMENT_BYTES) {
    return {
      kind: 'error',
      error: 'Screenshot is too large (max 5 MB). Try compressing the image and upload again.',
    };
  }

  const buffer = Buffer.from(await value.arrayBuffer());
  if (buffer.length > MAX_SUPPORT_ATTACHMENT_BYTES) {
    return {
      kind: 'error',
      error: 'Screenshot is too large (max 5 MB). Try compressing the image and upload again.',
    };
  }

  return {
    kind: 'ok',
    attachment: {
      filename,
      contentType: contentType.startsWith('image/') ? contentType : 'image/png',
      buffer,
    },
  };
}
