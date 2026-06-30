import { describe, expect, it } from 'vitest';
import { NextResponse } from 'next/server';
import { applyNoStoreHeaders, isAuthPath, withNoStoreIfAuthPath } from '@/lib/auth/cache-control';
import { isPublicUnauthenticatedPath, MARKETING_PATHS } from '@/lib/marketing/seo';

describe('isAuthPath', () => {
  it('matches login and auth routes', () => {
    expect(isAuthPath('/login')).toBe(true);
    expect(isAuthPath('/auth/callback')).toBe(true);
    expect(isAuthPath('/auth/reset-password')).toBe(true);
  });

  it('does not match marketing pages', () => {
    expect(isAuthPath('/pricing')).toBe(false);
    expect(isAuthPath('/dashboard')).toBe(false);
  });
});

describe('applyNoStoreHeaders', () => {
  it('sets no-store cache headers for CDN and browsers', () => {
    const response = applyNoStoreHeaders(NextResponse.next());
    expect(response.headers.get('Cache-Control')).toContain('no-store');
    expect(response.headers.get('CDN-Cache-Control')).toBe('no-store');
    expect(response.headers.get('Vercel-CDN-Cache-Control')).toBe('no-store');
  });
});

describe('withNoStoreIfAuthPath', () => {
  it('only applies no-store on auth paths', () => {
    const login = withNoStoreIfAuthPath('/login', NextResponse.next());
    const pricing = withNoStoreIfAuthPath('/pricing', NextResponse.next());
    expect(login.headers.get('Cache-Control')).toContain('no-store');
    expect(pricing.headers.get('Cache-Control')).toBeNull();
  });
});

describe('isPublicUnauthenticatedPath', () => {
  it('treats login as public without listing it as marketing', () => {
    expect(MARKETING_PATHS).not.toContain('/login');
    expect(isPublicUnauthenticatedPath('/login')).toBe(true);
    expect(isPublicUnauthenticatedPath('/pricing')).toBe(true);
    expect(isPublicUnauthenticatedPath('/offline')).toBe(true);
    expect(isPublicUnauthenticatedPath('/icons/192')).toBe(true);
    expect(isPublicUnauthenticatedPath('/dashboard')).toBe(false);
  });
});
