import { describe, expect, it } from 'vitest';
import {
  buildEmailDocument,
  parseResendInboundPayload,
  parseSendGridInboundForm,
} from '@/lib/inbound/parse-payload';

const PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

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

  it('parses SendGrid inline image metadata and embedded HTML images', async () => {
    const formData = new FormData();
    formData.set('from', 'shop@example.com');
    formData.set('to', 'u.token@inbound.upperdeck.dev');
    formData.set('subject', 'Promo');
    formData.set('text', '');
    formData.set(
      'html',
      `<p>Sale</p><img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" /><img src="cid:ii_abc123" />`
    );
    formData.set('attachments', '1');
    formData.set(
      'attachment-info',
      JSON.stringify({
        attachment1: {
          filename: 'hero.png',
          type: 'image/png',
          'content-id': 'ii_abc123',
        },
      })
    );
    formData.set(
      'attachment1',
      new File([Buffer.from(PNG_BASE64, 'base64')], 'hero.png', { type: 'image/png' })
    );

    const payload = await parseSendGridInboundForm(formData);

    expect(payload).not.toBeNull();
    expect(payload?.attachments.length).toBeGreaterThanOrEqual(2);
    expect(payload?.attachments.some((item) => item.inline)).toBe(true);
    expect(payload?.attachments.some((item) => item.filename.startsWith('embedded-image-'))).toBe(true);
  });
});
