import { describe, expect, it } from 'vitest';
import { isMultipartApiRoute, isPublicApiRoute } from '@/lib/auth/api-routes';

describe('api route middleware helpers', () => {
  it('treats upload and file replace as multipart', () => {
    expect(isMultipartApiRoute('/api/upload')).toBe(true);
    expect(isMultipartApiRoute('/api/files/abc/replace')).toBe(true);
    expect(isMultipartApiRoute('/api/account')).toBe(false);
  });

  it('allows public webhook and auth routes without a session', () => {
    expect(isPublicApiRoute('/api/health')).toBe(true);
    expect(isPublicApiRoute('/api/stripe/webhook')).toBe(true);
    expect(isPublicApiRoute('/api/inbound/email')).toBe(true);
    expect(isPublicApiRoute('/api/cron/sweep-files')).toBe(true);
    expect(isPublicApiRoute('/api/auth/sign-in')).toBe(true);
    expect(isPublicApiRoute('/api/account')).toBe(false);
  });
});
