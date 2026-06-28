import { createServiceClient } from '@/lib/supabase/admin';

type RecoveryInput = {
  email: string;
  password?: string;
  fullName?: string;
};

function hasServiceRoleKey(): boolean {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return Boolean(key && !key.includes('your-service-role'));
}

async function findUserByEmail(email: string) {
  const admin = createServiceClient();
  let page = 1;
  const perPage = 200;

  while (page <= 5) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const match = data.users.find((user) => user.email?.toLowerCase() === email);
    if (match) return match;

    if (data.users.length < perPage) break;
    page += 1;
  }

  return null;
}

/**
 * When Supabase blocks auth emails, confirm or create the account server-side
 * so the user can sign in without waiting for the rate limit to reset.
 */
export async function recoverAccountAfterEmailRateLimit(
  input: RecoveryInput
): Promise<{ recovered: true; message: string } | { recovered: false }> {
  if (!hasServiceRoleKey()) return { recovered: false };

  const email = input.email.trim().toLowerCase();
  const admin = createServiceClient();
  const existing = await findUserByEmail(email);

  if (existing) {
    if (existing.email_confirmed_at) {
      return {
        recovered: true,
        message:
          'Your account is already confirmed. Sign in with your email and password.',
      };
    }

    const { error } = await admin.auth.admin.updateUserById(existing.id, {
      email_confirm: true,
      ...(input.password ? { password: input.password } : {}),
      ...(input.fullName
        ? { user_metadata: { ...existing.user_metadata, full_name: input.fullName } }
        : {}),
    });

    if (error) return { recovered: false };

    return {
      recovered: true,
      message:
        'Email confirmation is complete. Sign in with your email and password. No confirmation email was needed.',
    };
  }

  if (!input.password || !input.fullName) {
    return { recovered: false };
  }

  const { error } = await admin.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      full_name: input.fullName,
      account_type: 'individual',
    },
  });

  if (error) return { recovered: false };

  return {
    recovered: true,
    message:
      'Account created. Sign in with your email and password. Confirmation email was skipped due to send limits.',
  };
}
