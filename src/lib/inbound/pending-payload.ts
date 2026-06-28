import { createServiceClient } from '@/lib/supabase/admin';
import type { InboundEmailPayload } from '@/lib/inbound/parse-payload';

const BUCKET = () => process.env.SUPABASE_STORAGE_BUCKET || 'briefnexus-files';

interface SerializedAttachment {
  filename: string;
  contentType: string;
  contentBase64: string;
  inline?: boolean;
}

interface SerializedInboundPayload {
  from: string;
  to: string[];
  subject: string;
  text: string;
  html?: string;
  attachments: SerializedAttachment[];
}

export function previewInboundBody(payload: InboundEmailPayload, maxLen = 280): string {
  const body = payload.text?.trim() || '';
  if (!body) return '(No message body)';
  if (body.length <= maxLen) return body;
  return `${body.slice(0, maxLen).trimEnd()}…`;
}

export function serializeInboundPayload(payload: InboundEmailPayload): string {
  const serialized: SerializedInboundPayload = {
    from: payload.from,
    to: payload.to,
    subject: payload.subject,
    text: payload.text,
    html: payload.html,
    attachments: payload.attachments.map((attachment) => ({
      filename: attachment.filename,
      contentType: attachment.contentType,
      contentBase64: attachment.content.toString('base64'),
      inline: attachment.inline,
    })),
  };
  return JSON.stringify(serialized);
}

export function deserializeInboundPayload(raw: string): InboundEmailPayload {
  const data = JSON.parse(raw) as SerializedInboundPayload;
  return {
    from: data.from,
    to: data.to ?? [],
    subject: data.subject,
    text: data.text ?? '',
    html: data.html,
    attachments: (data.attachments ?? []).map((attachment) => ({
      filename: attachment.filename,
      contentType: attachment.contentType,
      content: Buffer.from(attachment.contentBase64, 'base64'),
      inline: attachment.inline,
    })),
  };
}

export async function storePendingInboundPayload(
  eventId: string,
  payload: InboundEmailPayload
): Promise<string> {
  const path = `inbound-pending/${eventId}.json`;
  const admin = createServiceClient();
  const { error } = await admin.storage.from(BUCKET()).upload(path, Buffer.from(serializeInboundPayload(payload), 'utf8'), {
    contentType: 'application/json',
    upsert: true,
  });
  if (error) {
    throw new Error(error.message);
  }
  return path;
}

export async function loadPendingInboundPayload(storagePath: string): Promise<InboundEmailPayload | null> {
  const admin = createServiceClient();
  const { data, error } = await admin.storage.from(BUCKET()).download(storagePath);
  if (error || !data) return null;
  const raw = await data.text();
  return deserializeInboundPayload(raw);
}

export async function deletePendingInboundPayload(storagePath: string): Promise<void> {
  const admin = createServiceClient();
  await admin.storage.from(BUCKET()).remove([storagePath]);
}
