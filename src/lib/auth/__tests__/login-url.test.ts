import { describe, expect, it } from 'vitest';
import { loginHref, parseLoginMode, resolveLoginMode } from '@/lib/auth/login-url';

describe('loginHref', () => {
  it('builds signup and plan URLs', () => {
    expect(loginHref({ mode: 'signup' })).toBe('/login?mode=signup');
    expect(loginHref({ mode: 'signup', plan: 'pro' })).toBe('/login?mode=signup&plan=pro');
    expect(loginHref()).toBe('/login');
  });
});

describe('resolveLoginMode', () => {
  it('defaults to signin', () => {
    expect(resolveLoginMode({})).toBe('signin');
  });

  it('uses signup mode from query param', () => {
    expect(resolveLoginMode({ mode: 'signup' })).toBe('signup');
  });

  it('defaults to signup when a checkout plan is present without a mode', () => {
    expect(resolveLoginMode({ plan: 'pro-annual' })).toBe('signup');
  });

  it('honors an explicit mode even when a checkout plan is present', () => {
    expect(resolveLoginMode({ mode: 'signin', plan: 'pro-annual' })).toBe('signin');
  });
});

describe('parseLoginMode', () => {
  it('parses forgot mode', () => {
    expect(parseLoginMode('forgot')).toBe('forgot');
  });
});
