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
    'VERCEL_ENV',
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
    process.env.AUTH_SITE_URL = 'https://custom.example.com';
    process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000';
    expect(getSiteUrl()).toBe('https://custom.example.com');
  });

  it('prefers request host on preview deployments', () => {
    process.env.VERCEL_ENV = 'preview';
    process.env.VERCEL_PROJECT_PRODUCTION_URL = 'nexus-iota-orcin.vercel.app';
    expect(
      getSiteUrl({
        requestHost: 'preview-branch.vercel.app',
        requestProto: 'https',
      })
    ).toBe('https://preview-branch.vercel.app');
  });

  it('uses upperdeck.dev on production when env vars point at vercel', () => {
    process.env.VERCEL_ENV = 'production';
    process.env.VERCEL_PROJECT_PRODUCTION_URL = 'nexus-iota-orcin.vercel.app';
    process.env.VERCEL_URL = 'nexus-iota-orcin-abc123.vercel.app';
    process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000';
    expect(getSiteUrl()).toBe('https://upperdeck.dev');
  });

  it('uses upperdeck.dev when production request hits a vercel.app alias', () => {
    process.env.VERCEL_ENV = 'production';
    expect(
      getSiteUrl({
        requestHost: 'nexus-iota-orcin.vercel.app',
        requestProto: 'https',
      })
    ).toBe('https://upperdeck.dev');
  });

  it('uses custom domain from request host on production', () => {
    process.env.VERCEL_ENV = 'production';
    expect(
      getSiteUrl({
        requestHost: 'upperdeck.dev',
        requestProto: 'https',
      })
    ).toBe('https://upperdeck.dev');
  });

  it('prefers VERCEL_URL over localhost NEXT_PUBLIC_SITE_URL on preview', () => {
    process.env.VERCEL_ENV = 'preview';
    process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000';
    process.env.VERCEL_URL = 'nexus-iota-orcin.vercel.app';
    expect(getSiteUrl()).toBe('https://nexus-iota-orcin.vercel.app');
  });

  it('falls back to VERCEL_URL for preview deployments', () => {
    process.env.VERCEL_ENV = 'preview';
    process.env.VERCEL_URL = 'nexus-git-feature-b2c-b2b-tenancy-simd.vercel.app';
    expect(getSiteUrl()).toBe('https://nexus-git-feature-b2c-b2b-tenancy-simd.vercel.app');
  });

  it('uses NEXT_PUBLIC_SITE_URL when not on Vercel', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://staging.example.com/';
    expect(getSiteUrl()).toBe('https://staging.example.com');
  });

  it('defaults to localhost for local dev', () => {
    expect(getSiteUrl()).toBe('http://localhost:3000');
  });
});

describe('getSiteUrlFromRequest', () => {
  const originalVercelEnv = process.env.VERCEL_ENV;

  afterEach(() => {
    if (originalVercelEnv === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = originalVercelEnv;
  });

  it('uses request origin for production callback hits on custom domain', () => {
    process.env.VERCEL_ENV = 'production';
    const request = new Request('https://upperdeck.dev/auth/callback?code=abc');
    expect(getSiteUrlFromRequest(request)).toBe('https://upperdeck.dev');
  });

  it('maps production vercel.app callback hits to upperdeck.dev', () => {
    process.env.VERCEL_ENV = 'production';
    const request = new Request(
      'https://nexus-iota-orcin.vercel.app/auth/callback?code=abc'
    );
    expect(getSiteUrlFromRequest(request)).toBe('https://upperdeck.dev');
  });

  it('falls back to env when callback is on localhost', () => {
    process.env.VERCEL_ENV = 'preview';
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
    expect(getAuthCallbackUrl('https://upperdeck.dev')).toBe(
      'https://upperdeck.dev/auth/callback'
    );
  });
});
