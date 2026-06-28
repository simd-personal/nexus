import { describe, expect, it } from 'vitest';
import {
  enrichInboundPayload,
  extractEmbeddedImagesFromHtml,
  mergeInboundAttachments,
} from '@/lib/inbound/enrich-payload';

const PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

describe('enrich inbound payload', () => {
  it('extracts embedded data URI images from HTML', () => {
    const html = `<p>Hello</p><img src="data:image/png;base64,${PNG_BASE64}" alt="chart" />`;
    const images = extractEmbeddedImagesFromHtml(html);

    expect(images).toHaveLength(1);
    expect(images[0]?.filename).toBe('embedded-image-1.png');
    expect(images[0]?.inline).toBe(true);
    expect(images[0]?.content.length).toBeGreaterThan(0);
  });

  it('merges embedded images without duplicating existing attachments', () => {
    const existing = [
      {
        filename: 'embedded-image-1.png',
        contentType: 'image/png',
        content: Buffer.from(PNG_BASE64, 'base64'),
      },
    ];
    const embedded = extractEmbeddedImagesFromHtml(
      `<img src="data:image/png;base64,${PNG_BASE64}" />`
    );

    const merged = mergeInboundAttachments(existing, embedded);
    expect(merged).toHaveLength(1);
  });

  it('enriches payload with HTML embedded images', () => {
    const enriched = enrichInboundPayload({
      from: 'sender@example.com',
      to: ['u.token@inbound.upperdeck.dev'],
      subject: 'Newsletter',
      text: 'See below',
      html: `<div style="background-image:url(data:image/png;base64,${PNG_BASE64})">Hi</div>`,
      attachments: [],
    });

    expect(enriched.attachments).toHaveLength(1);
    expect(enriched.attachments[0]?.contentType).toBe('image/png');
  });
});
