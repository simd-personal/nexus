export interface InboundAttachment {
  filename: string;
  contentType: string;
  content: Buffer;
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

  return {
    from: String(payload.from ?? ''),
    to: parseAddressList(payload.to),
    subject: String(payload.subject ?? '(no subject)'),
    text,
    html: typeof payload.html === 'string' ? payload.html : undefined,
    attachments,
  };
}

export async function parseSendGridInboundForm(formData: FormData): Promise<InboundEmailPayload | null> {
  const from = String(formData.get('from') ?? '');
  const to = parseAddressList(String(formData.get('to') ?? ''));
  const subject = String(formData.get('subject') ?? '(no subject)');
  const text = String(formData.get('text') ?? '');
  const html = String(formData.get('html') ?? '');

  const attachments: InboundAttachment[] = [];
  const count = Number(formData.get('attachments') ?? formData.get('attachment-count') ?? 0);
  for (let index = 1; index <= count; index += 1) {
    const file = formData.get(`attachment${index}`) ?? formData.get(`attachment-${index}`);
    if (!(file instanceof File) || file.size === 0) continue;
    attachments.push({
      filename: file.name || `attachment-${index}`,
      contentType: file.type || 'application/octet-stream',
      content: Buffer.from(await file.arrayBuffer()),
    });
  }

  if (!from && !to.length && !text && !attachments.length) return null;

  return {
    from,
    to,
    subject,
    text: text || html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
    html: html || undefined,
    attachments,
  };
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
