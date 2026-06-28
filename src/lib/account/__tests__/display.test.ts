import { describe, expect, it } from 'vitest';
import { getAccountDisplaySummary } from '@/lib/account/display';

describe('getAccountDisplaySummary', () => {
  it('uses full name and organization when available', () => {
    expect(
      getAccountDisplaySummary({
        fullName: 'Sim Patel',
        email: 'sim@upperdeck.dev',
        accountType: 'enterprise',
        organizationName: 'Acme Health',
      })
    ).toEqual({
      displayName: 'Sim Patel',
      subtitle: 'Acme Health',
    });
  });

  it('falls back to email local part when full name is missing', () => {
    expect(
      getAccountDisplaySummary({
        fullName: null,
        email: 'sim@upperdeck.dev',
        accountType: 'individual',
        organizationName: null,
      })
    ).toEqual({
      displayName: 'sim',
      subtitle: 'Personal account',
    });
  });

  it('shows organization label for enterprise accounts without org name', () => {
    expect(
      getAccountDisplaySummary({
        fullName: 'Sim Patel',
        email: 'sim@upperdeck.dev',
        accountType: 'enterprise',
        organizationName: null,
      })
    ).toEqual({
      displayName: 'Sim Patel',
      subtitle: 'Organization',
    });
  });
});
