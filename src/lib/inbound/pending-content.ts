import type { InboundEmailPayload } from '@/lib/inbound/parse-payload';
import {
  loadPendingInboundPayload,
  previewInboundBody,
} from '@/lib/inbound/pending-payload';

export interface InboundAttachmentMeta {
  filename: string;
  contentType: string;
  size: number;
  inline?: boolean;
}

export interface PendingInboundEventRecord {
  payload_storage_path: string | null;
  from_address: string | null;
  subject: string | null;
  body_text: string | null;
  body_preview: string | null;
  attachments_meta?: InboundAttachmentMeta[] | null;
}

export function buildAttachmentsMeta(payload: InboundEmailPayload): InboundAttachmentMeta[] {
  return payload.attachments.map((attachment) => ({
    filename: attachment.filename,
    contentType: attachment.contentType,
    size: attachment.content.length,
    inline: attachment.inline ?? false,
  }));
}

export function hasAssignableInboundContent(event: PendingInboundEventRecord): boolean {
  if (event.payload_storage_path) return true;
  return Boolean(event.body_text?.trim());
}

export async function resolvePendingEmailPayload(
  event: PendingInboundEventRecord
): Promise<InboundEmailPayload | null> {
  if (event.payload_storage_path) {
    const loaded = await loadPendingInboundPayload(event.payload_storage_path);
    if (loaded) return loaded;
  }

  const text = event.body_text?.trim() ?? '';
  if (!text && !event.subject?.trim()) {
    return null;
  }

  return {
    from: event.from_address ?? '',
    to: [],
    subject: event.subject ?? '(no subject)',
    text,
    attachments: [],
  };
}

export function formatPendingEmailForView(
  event: PendingInboundEventRecord,
  payload: InboundEmailPayload | null
): {
  from: string;
  subject: string;
  text: string;
  attachments: InboundAttachmentMeta[];
  contentAvailable: boolean;
} {
  const payloadAttachments =
    payload?.attachments.map((attachment) => ({
      filename: attachment.filename,
      contentType: attachment.contentType,
      size: attachment.content.length,
      inline: attachment.inline ?? false,
    })) ?? [];

  const attachments =
    payloadAttachments.length > 0 ? payloadAttachments : event.attachments_meta ?? [];

  const text =
    payload?.text?.trim() ||
    event.body_text?.trim() ||
    event.body_preview?.trim() ||
    '';

  return {
    from: payload?.from || event.from_address || 'Unknown sender',
    subject: payload?.subject || event.subject || '(No subject)',
    text: text || '(No message body saved for this email.)',
    attachments,
    contentAvailable: hasAssignableInboundContent(event),
  };
}

export function inboundEventInsertFields(payload: InboundEmailPayload) {
  return {
    body_preview: previewInboundBody(payload),
    body_text: payload.text || null,
    attachment_count: payload.attachments.length,
    attachments_meta: buildAttachmentsMeta(payload),
  };
}
