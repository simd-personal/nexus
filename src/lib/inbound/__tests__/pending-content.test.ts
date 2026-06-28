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
});
