import { describe, expect, it } from 'vitest';
import {
  formatPendingEmailForView,
  hasAssignableInboundContent,
  inboundEventInsertFields,
} from '@/lib/inbound/pending-content';
import type { InboundEmailPayload } from '@/lib/inbound/parse-payload';

const payload: InboundEmailPayload = {
  from: 'sender@example.com',
  to: ['u.token@inbound.upperdeck.dev'],
  subject: 'Meeting notes',
  text: 'Please review the attached deck before tomorrow.',
  attachments: [{ filename: 'deck.pdf', contentType: 'application/pdf', content: Buffer.from('pdf') }],
};

describe('pending inbound content', () => {
  it('detects assignable content from body text fallback', () => {
    expect(
      hasAssignableInboundContent({
        payload_storage_path: null,
        from_address: 'sender@example.com',
        subject: 'Hello',
        body_text: 'Body here',
        body_preview: 'Body here',
      })
    ).toBe(true);

    expect(
      hasAssignableInboundContent({
        payload_storage_path: null,
        from_address: 'sender@example.com',
        subject: 'Hello',
        body_text: null,
        body_preview: 'Original message content was not saved.',
      })
    ).toBe(false);
  });

  it('builds insert fields for inbound events', () => {
    const fields = inboundEventInsertFields(payload);
    expect(fields.body_text).toBe(payload.text);
    expect(fields.attachment_count).toBe(1);
    expect(fields.attachments_meta[0]?.filename).toBe('deck.pdf');
  });

  it('formats email view data from stored fields', () => {
    const view = formatPendingEmailForView(
      {
        payload_storage_path: null,
        from_address: 'sender@example.com',
        subject: 'Meeting notes',
        body_text: 'Full email body',
        body_preview: 'Full email…',
        attachments_meta: [{ filename: 'deck.pdf', contentType: 'application/pdf', size: 3 }],
      },
      null
    );

    expect(view.text).toBe('Full email body');
    expect(view.attachments).toHaveLength(1);
    expect(view.contentAvailable).toBe(true);
  });

  it('prefers payload attachments and body when payload is loaded', () => {
    const view = formatPendingEmailForView(
      {
        payload_storage_path: 'pending/evt-1.json',
        from_address: 'legacy@example.com',
        subject: 'Legacy subject',
        body_text: 'Legacy body',
        body_preview: 'Legacy preview',
        attachments_meta: [{ filename: 'old.pdf', contentType: 'application/pdf', size: 1 }],
      },
      {
        ...payload,
        text: 'Loaded body with attachment',
        attachments: [
          {
            filename: 'loaded.png',
            contentType: 'image/png',
            content: Buffer.from('png'),
            inline: true,
          },
        ],
      }
    );

    expect(view.text).toBe('Loaded body with attachment');
    expect(view.attachments).toEqual([
      {
        filename: 'loaded.png',
        contentType: 'image/png',
        size: 3,
        inline: true,
      },
    ]);
    expect(view.from).toBe('sender@example.com');
    expect(view.subject).toBe('Meeting notes');
  });

  it('falls back to attachment metadata when payload has no files', () => {
    const view = formatPendingEmailForView(
      {
        payload_storage_path: null,
        from_address: 'sender@example.com',
        subject: 'Meeting notes',
        body_text: 'Body only',
        body_preview: 'Body only',
        attachments_meta: [{ filename: 'deck.pdf', contentType: 'application/pdf', size: 3 }],
      },
      {
        from: 'sender@example.com',
        to: [],
        subject: 'Meeting notes',
        text: 'Body only',
        attachments: [],
      }
    );

    expect(view.attachments).toEqual([
      { filename: 'deck.pdf', contentType: 'application/pdf', size: 3 },
    ]);
  });
});
