import { describe, expect, it } from 'vitest';
import { isDuplicateSignUp, mapAuthErrorMessage } from '@/lib/auth/auth-errors';

describe('mapAuthErrorMessage', () => {
  it('maps duplicate registration errors', () => {
    expect(mapAuthErrorMessage('User already registered')).toContain('already exists');
  });

  it('maps invalid credentials', () => {
    expect(mapAuthErrorMessage('Invalid login credentials')).toBe('Incorrect email or password.');
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
