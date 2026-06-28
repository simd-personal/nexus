import { describe, expect, it, afterEach, beforeEach } from 'vitest';
import {
  getAuthCallbackUrl,
  getSiteUrl,
  getSiteUrlFromRequest,
  safeAuthNextPath,
} from '@/lib/auth/site-url';

describe('getSiteUrl', () => {
  const envKeys = [
    'AUTH_SITE_URL',
    'NEXT_PUBLIC_SITE_URL',
    'VERCEL_URL',
    'VERCEL_PROJECT_PRODUCTION_URL',
  ] as const;
  const original: Record<string, string | undefined> = {};

  afterEach(() => {
    for (const key of envKeys) {
      if (original[key] === undefined) delete process.env[key];
      else process.env[key] = original[key];
    }
  });

  beforeEach(() => {
    for (const key of envKeys) {
      original[key] = process.env[key];
      delete process.env[key];
    }
  });

  it('uses AUTH_SITE_URL when set', () => {
    process.env.AUTH_SITE_URL = 'https://nexus-iota-orcin.vercel.app';
    process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000';
    expect(getSiteUrl()).toBe('https://nexus-iota-orcin.vercel.app');
  });

  it('prefers request host over Vercel env', () => {
    process.env.VERCEL_PROJECT_PRODUCTION_URL = 'nexus-iota-orcin.vercel.app';
    expect(
      getSiteUrl({
        requestHost: 'preview-branch.vercel.app',
        requestProto: 'https',
      })
    ).toBe('https://preview-branch.vercel.app');
  });

  it('uses VERCEL_PROJECT_PRODUCTION_URL on production deploys', () => {
    process.env.VERCEL_PROJECT_PRODUCTION_URL = 'nexus-iota-orcin.vercel.app';
    process.env.VERCEL_URL = 'nexus-iota-orcin-abc123.vercel.app';
    process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000';
    expect(getSiteUrl()).toBe('https://nexus-iota-orcin.vercel.app');
  });

  it('prefers VERCEL_URL over localhost NEXT_PUBLIC_SITE_URL', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000';
    process.env.VERCEL_URL = 'nexus-iota-orcin.vercel.app';
    expect(getSiteUrl()).toBe('https://nexus-iota-orcin.vercel.app');
  });

  it('falls back to VERCEL_URL for preview deployments', () => {
    process.env.VERCEL_URL = 'nexus-git-feature-b2c-b2b-tenancy-simd.vercel.app';
    expect(getSiteUrl()).toBe('https://nexus-git-feature-b2c-b2b-tenancy-simd.vercel.app');
  });

  it('uses NEXT_PUBLIC_SITE_URL when not on Vercel', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://nexus-iota-orcin.vercel.app/';
    expect(getSiteUrl()).toBe('https://nexus-iota-orcin.vercel.app');
  });

  it('defaults to localhost for local dev', () => {
    expect(getSiteUrl()).toBe('http://localhost:3000');
  });
});

describe('getSiteUrlFromRequest', () => {
  it('uses request origin for production callback hits', () => {
    const request = new Request(
      'https://nexus-iota-orcin.vercel.app/auth/callback?code=abc'
    );
    expect(getSiteUrlFromRequest(request)).toBe('https://nexus-iota-orcin.vercel.app');
  });

  it('falls back to env when callback is on localhost', () => {
    process.env.VERCEL_URL = 'nexus-iota-orcin.vercel.app';
    const request = new Request('http://localhost:3000/auth/callback?code=abc');
    expect(getSiteUrlFromRequest(request)).toBe('https://nexus-iota-orcin.vercel.app');
    delete process.env.VERCEL_URL;
  });
});

describe('safeAuthNextPath', () => {
  it('defaults to dashboard', () => {
    expect(safeAuthNextPath(null)).toBe('/dashboard');
  });

  it('rejects open redirects', () => {
    expect(safeAuthNextPath('https://evil.com')).toBe('/dashboard');
    expect(safeAuthNextPath('//evil.com')).toBe('/dashboard');
  });

  it('allows relative paths', () => {
    expect(safeAuthNextPath('/settings')).toBe('/settings');
  });
});

describe('getAuthCallbackUrl', () => {
  it('uses auth callback path without query params for Supabase allow-list', () => {
    expect(getAuthCallbackUrl('https://nexus-iota-orcin.vercel.app')).toBe(
      'https://nexus-iota-orcin.vercel.app/auth/callback'
    );
  });
});
