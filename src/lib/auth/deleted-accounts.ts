import { createServiceClient } from '@/lib/supabase/admin';

export const BLOCKED_SIGNUP_MESSAGE =
  'This email belonged to a deleted account and can’t be used to sign up again. Contact support if you think this is a mistake.';

/**
 * Records a deleted account. Free accounts that consumed their quota are
 * blocked from re-signup (prevents deleting to reset free limits); accounts
 * with any paid history stay welcome back.
 */
export async function recordDeletedAccount(input: {
  email: string;
  wasPaid: boolean;
  hitFreeLimit: boolean;
}): Promise<void> {
  const email = input.email.trim().toLowerCase();
  if (!email) return;

  const supabase = createServiceClient();
  const { error } = await supabase.from('deleted_accounts').upsert(
    {
      email,
      was_paid: input.wasPaid,
      hit_free_limit: input.hitFreeLimit,
      deleted_at: new Date().toISOString(),
    },
    { onConflict: 'email' }
  );

  if (error) {
    console.error('Could not record deleted account:', error.message);
  }
}

/** True when a previously deleted free account used up its quota. */
export async function isEmailBlockedFromSignup(email: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('deleted_accounts')
    .select('was_paid, hit_free_limit')
    .eq('email', normalized)
    .maybeSingle();

  if (error) {
    // Fail open — signup availability matters more than quota-abuse edge cases.
    console.error('Deleted-account lookup failed:', error.message);
    return false;
  }

  return Boolean(data && !data.was_paid && data.hit_free_limit);
}
