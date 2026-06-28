import { describe, expect, it } from 'vitest';
import {
  buildProjectInboundAddress,
  buildUserInboundAddress,
  extractInboundRecipients,
  parseInboundRecipient,
} from '@/lib/inbound/addresses';

describe('inbound addresses', () => {
  it('builds project and user addresses from tokens', () => {
    expect(buildProjectInboundAddress('abc123')).toMatch(/^p\.abc123@/);
    expect(buildUserInboundAddress('xyz789')).toMatch(/^u\.xyz789@/);
  });

  it('parses project and user local parts', () => {
    expect(parseInboundRecipient('p.abc123@inbound.upperdeck.dev')).toEqual({
      type: 'project',
      token: 'abc123',
    });
    expect(parseInboundRecipient('u.xyz789@inbound.upperdeck.dev')).toEqual({
      type: 'user',
      token: 'xyz789',
    });
    expect(parseInboundRecipient('not-inbound@example.com')).toBeNull();
  });

  it('extracts inbound recipients from a mixed list', () => {
    expect(
      extractInboundRecipients([
        'Sender <sender@example.com>',
        'p.token1@inbound.upperdeck.dev',
        'u.token2@inbound.upperdeck.dev',
      ])
    ).toEqual([
      { type: 'project', token: 'token1' },
      { type: 'user', token: 'token2' },
    ]);
  });
});
