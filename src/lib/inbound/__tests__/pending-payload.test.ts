import { describe, expect, it } from 'vitest';
import {
  deserializeInboundPayload,
  previewInboundBody,
  serializeInboundPayload,
} from '@/lib/inbound/pending-payload';
import type { InboundEmailPayload } from '@/lib/inbound/parse-payload';

const samplePayload: InboundEmailPayload = {
  from: 'sender@example.com',
  to: ['u.abc123@inbound.upperdeck.dev'],
  subject: 'Fwd: Weekly update',
  text: 'Please review the attached deck before tomorrow.',
  attachments: [
    {
      filename: 'deck.pdf',
      contentType: 'application/pdf',
      content: Buffer.from('%PDF-1.4'),
    },
  ],
};

describe('pending inbound payload', () => {
  it('round trips payload through JSON storage format', () => {
    const restored = deserializeInboundPayload(serializeInboundPayload(samplePayload));
    expect(restored.from).toBe(samplePayload.from);
    expect(restored.subject).toBe(samplePayload.subject);
    expect(restored.attachments[0]?.filename).toBe('deck.pdf');
    expect(restored.attachments[0]?.content.toString()).toBe('%PDF-1.4');
  });

  it('builds a short preview for dashboard display', () => {
    expect(previewInboundBody(samplePayload)).toContain('attached deck');
    const longPayload = {
      ...samplePayload,
      text: 'a'.repeat(400),
    };
    expect(previewInboundBody(longPayload)).toHaveLength(281);
    expect(previewInboundBody(longPayload).endsWith('…')).toBe(true);
  });
});
