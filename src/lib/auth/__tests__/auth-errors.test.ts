import { describe, expect, it } from 'vitest';
import {
  isDuplicateSignUp,
  isEmailRateLimitError,
  mapAuthErrorMessage,
} from '@/lib/auth/auth-errors';

describe('mapAuthErrorMessage', () => {
  it('maps duplicate registration errors', () => {
    expect(mapAuthErrorMessage('User already registered')).toContain('already exists');
  });

  it('maps invalid credentials', () => {
    expect(mapAuthErrorMessage('Invalid login credentials')).toBe('Incorrect email or password.');
  });

  it('maps email rate limit errors', () => {
    expect(mapAuthErrorMessage('email rate limit exceeded')).toContain('Too many confirmation emails');
  });
});

describe('isEmailRateLimitError', () => {
  it('detects Supabase rate limit messages', () => {
    expect(isEmailRateLimitError('429: email rate limit exceeded')).toBe(true);
  });
});

describe('isDuplicateSignUp', () => {
  it('detects Supabase obfuscated duplicate signup responses', () => {
    expect(
      isDuplicateSignUp({
        user: { identities: [] },
      })
    ).toBe(true);
  });

  it('allows new signups with identities', () => {
    expect(
      isDuplicateSignUp({
        user: { identities: [{ id: 'identity-1' }] },
      })
    ).toBe(false);
  });
});
