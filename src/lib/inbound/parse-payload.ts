import { enrichInboundPayload } from '@/lib/inbound/enrich-payload';

export interface InboundAttachment {
  filename: string;
  contentType: string;
  content: Buffer;
  inline?: boolean;
}

export interface InboundEmailPayload {
  from: string;
  to: string[];
  subject: string;
  text: string;
  html?: string;
  attachments: InboundAttachment[];
}

function parseAddressList(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.flatMap((entry) => parseAddressList(entry));
  }
  if (typeof value === 'object' && value !== null && 'email' in value) {
    const email = (value as { email?: string }).email;
    return email ? [email] : [];
  }
  if (typeof value !== 'string') return [];

  return value
    .split(',')
    .map((part) => {
      const match = part.match(/<([^>]+)>/);
      return (match?.[1] ?? part).trim();
    })
    .filter(Boolean);
}

function decodeAttachmentContent(value: unknown): Buffer {
  if (Buffer.isBuffer(value)) return value;
  if (value instanceof ArrayBuffer) return Buffer.from(value);
  if (typeof value === 'string') {
    try {
      return Buffer.from(value, 'base64');
    } catch {
      return Buffer.from(value);
    }
  }
  return Buffer.from('');
}

export function parseResendInboundPayload(body: unknown): InboundEmailPayload | null {
  if (!body || typeof body !== 'object') return null;
  const data = body as Record<string, unknown>;
  const payload = (data.data as Record<string, unknown> | undefined) ?? data;

  const attachments = Array.isArray(payload.attachments)
    ? payload.attachments
        .map((attachment) => {
          if (!attachment || typeof attachment !== 'object') return null;
          const item = attachment as Record<string, unknown>;
          const filename = String(item.filename ?? item.name ?? 'attachment');
          const contentType = String(item.content_type ?? item.type ?? 'application/octet-stream');
          const content = decodeAttachmentContent(item.content);
          if (!content.length) return null;
          return { filename, contentType, content };
        })
        .filter((item): item is InboundAttachment => item !== null)
    : [];

  const text =
    typeof payload.text === 'string'
      ? payload.text
      : typeof payload.html === 'string'
        ? payload.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
        : '';

  return enrichInboundPayload({
    from: String(payload.from ?? ''),
    to: parseAddressList(payload.to),
    subject: String(payload.subject ?? '(no subject)'),
    text,
    html: typeof payload.html === 'string' ? payload.html : undefined,
    attachments,
  });
}

export async function parseSendGridInboundForm(formData: FormData): Promise<InboundEmailPayload | null> {
  const from = String(formData.get('from') ?? '');
  const to = parseAddressList(String(formData.get('to') ?? ''));
  const subject = String(formData.get('subject') ?? '(no subject)');
  const text = String(formData.get('text') ?? '');
  const html = String(formData.get('html') ?? '');

  const attachmentInfo = parseSendGridAttachmentInfo(formData.get('attachment-info'));

  const attachments: InboundAttachment[] = [];
  const count = Number(formData.get('attachments') ?? formData.get('attachment-count') ?? 0);
  for (let index = 1; index <= count; index += 1) {
    const attachmentKey = `attachment${index}`;
    const file = formData.get(attachmentKey) ?? formData.get(`attachment-${index}`);
    if (!(file instanceof File) || file.size === 0) continue;

    const info = attachmentInfo[attachmentKey];
    const contentId = info?.['content-id'] ?? info?.contentId;
    const infoFilename = info?.filename || info?.name;
    const contentType = info?.type || file.type || 'application/octet-stream';
    const isInlineImage = Boolean(contentId) && contentType.startsWith('image/');

    let filename = infoFilename || file.name || attachmentKey;
    if (isInlineImage && (!infoFilename || infoFilename === attachmentKey)) {
      const ext = extensionFromMime(contentType) ?? 'png';
      const cidSlug = sanitizeContentId(contentId!);
      filename = `inline-${cidSlug}.${ext}`;
    }

    attachments.push({
      filename,
      contentType,
      content: Buffer.from(await file.arrayBuffer()),
      inline: isInlineImage,
    });
  }

  if (!from && !to.length && !text && !html && !attachments.length) return null;

  const payload: InboundEmailPayload = {
    from,
    to,
    subject,
    text: text || html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
    html: html || undefined,
    attachments,
  };

  return enrichInboundPayload(payload);
}

interface SendGridAttachmentInfoEntry {
  filename?: string;
  name?: string;
  type?: string;
  'content-id'?: string;
  contentId?: string;
}

function parseSendGridAttachmentInfo(value: FormDataEntryValue | null): Record<string, SendGridAttachmentInfoEntry> {
  if (typeof value !== 'string' || !value.trim()) return {};
  try {
    const parsed = JSON.parse(value) as Record<string, SendGridAttachmentInfoEntry>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function extensionFromMime(mimeType: string): string | null {
  const map: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/gif': 'gif',
    'image/webp': 'webp',
  };
  return map[mimeType.toLowerCase()] ?? null;
}

function sanitizeContentId(contentId: string): string {
  return contentId.replace(/[^a-zA-Z0-9._-]+/g, '-').slice(0, 40) || 'image';
}

export function buildEmailDocument(payload: InboundEmailPayload): string {
  const lines = [
    `From: ${payload.from}`,
    `To: ${payload.to.join(', ')}`,
    `Subject: ${payload.subject}`,
    `Date: ${new Date().toUTCString()}`,
    '',
    payload.text || '(empty body)',
  ];
  return lines.join('\n');
}
