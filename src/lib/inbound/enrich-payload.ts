import type { InboundAttachment, InboundEmailPayload } from '@/lib/inbound/parse-payload';

const DATA_URI_PATTERN =
  /data:image\/(png|jpe?g|gif|webp);base64,([a-zA-Z0-9+/=\s]+)/gi;

const MIME_BY_EXT: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
};

function extensionForImageType(type: string): string {
  const normalized = type.toLowerCase();
  if (normalized === 'jpeg') return 'jpg';
  return normalized;
}

function fingerprint(attachment: InboundAttachment): string {
  return `${attachment.contentType}:${attachment.content.length}:${attachment.content.toString('base64').slice(0, 48)}`;
}

function decodeDataUriImage(match: RegExpExecArray, index: number): InboundAttachment | null {
  const type = match[1];
  const base64 = match[2]?.replace(/\s+/g, '') ?? '';
  if (!base64) return null;

  try {
    const content = Buffer.from(base64, 'base64');
    if (!content.length) return null;
    const ext = extensionForImageType(type);
    return {
      filename: `embedded-image-${index}.${ext}`,
      contentType: MIME_BY_EXT[ext] ?? `image/${ext}`,
      content,
      inline: true,
    };
  } catch {
    return null;
  }
}

export function extractEmbeddedImagesFromHtml(html?: string): InboundAttachment[] {
  if (!html?.trim()) return [];

  const images: InboundAttachment[] = [];
  const seen = new Set<string>();
  let index = 1;

  DATA_URI_PATTERN.lastIndex = 0;
  let match = DATA_URI_PATTERN.exec(html);
  while (match) {
    const image = decodeDataUriImage(match, index);
    if (image) {
      const key = fingerprint(image);
      if (!seen.has(key)) {
        seen.add(key);
        images.push(image);
        index += 1;
      }
    }
    match = DATA_URI_PATTERN.exec(html);
  }

  return images;
}

export function mergeInboundAttachments(
  attachments: InboundAttachment[],
  embedded: InboundAttachment[]
): InboundAttachment[] {
  const merged = [...attachments];
  const seen = new Set(merged.map(fingerprint));

  for (const image of embedded) {
    const key = fingerprint(image);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(image);
  }

  return merged;
}

export function enrichInboundPayload(payload: InboundEmailPayload): InboundEmailPayload {
  const embedded = extractEmbeddedImagesFromHtml(payload.html);
  const attachments = mergeInboundAttachments(payload.attachments, embedded);
  return {
    ...payload,
    attachments,
  };
}

export function countInboundImages(payload: InboundEmailPayload): number {
  return payload.attachments.filter((attachment) => attachment.contentType.startsWith('image/')).length;
}
