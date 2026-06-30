import { describe, expect, it } from 'vitest';
import { serverActionAllowedOrigins } from '@/lib/auth/server-action-origins';

describe('serverActionAllowedOrigins', () => {
  it('includes production domain and vercel wildcards', () => {
    const origins = serverActionAllowedOrigins();
    expect(origins).toContain('upperdeck.dev');
    expect(origins).toContain('www.upperdeck.dev');
    expect(origins).toContain('*.vercel.app');
    expect(origins).toContain('*.upperdeck.dev');
  });
});
