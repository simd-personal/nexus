import type { AccountType } from '@/types/database';

export interface AccountDisplayInput {
  fullName: string | null | undefined;
  email: string | null | undefined;
  accountType: AccountType | null | undefined;
  organizationName: string | null | undefined;
}

export function getAccountDisplaySummary(input: AccountDisplayInput): {
  displayName: string;
  subtitle: string;
} {
  const displayName =
    input.fullName?.trim() ||
    input.email?.split('@')[0]?.trim() ||
    'Your account';

  const organizationName = input.organizationName?.trim();
  if (organizationName) {
    return { displayName, subtitle: organizationName };
  }

  if (input.accountType === 'enterprise') {
    return { displayName, subtitle: 'Organization' };
  }

  return { displayName, subtitle: 'Personal account' };
}
