import { describe, expect, it } from 'vitest';
import {
  buildEmailDocument,
  parseResendInboundPayload,
} from '@/lib/inbound/parse-payload';

describe('parse inbound payload', () => {
  it('parses Resend inbound webhook shape', () => {
    const payload = parseResendInboundPayload({
      data: {
        from: 'client@example.com',
        to: ['p.abc@inbound.upperdeck.dev'],
        subject: 'Contract draft',
        text: 'Please review attached.',
        attachments: [
          {
            filename: 'contract.pdf',
            content_type: 'application/pdf',
            content: Buffer.from('pdf-bytes').toString('base64'),
          },
        ],
      },
    });

    expect(payload).not.toBeNull();
    expect(payload?.from).toBe('client@example.com');
    expect(payload?.to).toEqual(['p.abc@inbound.upperdeck.dev']);
    expect(payload?.attachments).toHaveLength(1);
    expect(payload?.attachments[0].filename).toBe('contract.pdf');
  });

  it('builds a readable email document', () => {
    const doc = buildEmailDocument({
      from: 'a@example.com',
      to: ['p.token@inbound.upperdeck.dev'],
      subject: 'Hello',
      text: 'Body text',
      attachments: [],
    });

    expect(doc).toContain('From: a@example.com');
    expect(doc).toContain('Subject: Hello');
    expect(doc).toContain('Body text');
  });
});
