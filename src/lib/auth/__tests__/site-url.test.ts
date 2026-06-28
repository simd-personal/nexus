import { describe, expect, it, afterEach } from 'vitest';
import { getSiteUrl } from '@/lib/auth/site-url';

describe('getSiteUrl', () => {
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const originalVercelUrl = process.env.VERCEL_URL;

  afterEach(() => {
    if (originalSiteUrl === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
    if (originalVercelUrl === undefined) delete process.env.VERCEL_URL;
    else process.env.VERCEL_URL = originalVercelUrl;
  });

  it('uses NEXT_PUBLIC_SITE_URL when set', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://nexus-iota-orcin.vercel.app/';
    delete process.env.VERCEL_URL;
    expect(getSiteUrl()).toBe('https://nexus-iota-orcin.vercel.app');
  });

  it('falls back to VERCEL_URL for preview deployments', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    process.env.VERCEL_URL = 'nexus-git-feature-b2c-b2b-tenancy-simd.vercel.app';
    expect(getSiteUrl()).toBe('https://nexus-git-feature-b2c-b2b-tenancy-simd.vercel.app');
  });

  it('defaults to localhost for local dev', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.VERCEL_URL;
    expect(getSiteUrl()).toBe('http://localhost:3000');
  });
});
