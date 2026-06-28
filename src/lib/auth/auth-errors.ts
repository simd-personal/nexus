export function isEmailRateLimitError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('email rate limit exceeded') ||
    lower.includes('over_email_send_rate_limit') ||
    lower.includes('rate limit')
  );
}

export function mapAuthErrorMessage(message: string): string {
  const lower = message.toLowerCase();

  if (isEmailRateLimitError(message)) {
    return 'Too many confirmation emails were sent recently. Wait about an hour and try again, or sign in if you already confirmed your email.';
  }

  if (
    lower.includes('already registered') ||
    lower.includes('already been registered') ||
    lower.includes('user already exists')
  ) {
    return 'An account with this email already exists. Sign in instead, or use Forgot password if you need help.';
  }

  if (lower.includes('invalid login credentials')) {
    return 'Incorrect email or password.';
  }

  if (lower.includes('email not confirmed')) {
    return 'Confirm your email before signing in. Check your inbox or resend the confirmation email.';
  }

  if (lower.includes('signup is disabled')) {
    return 'New signups are temporarily disabled. Please try again later.';
  }

  return message;
}

export function isDuplicateSignUp(data: {
  user: { identities?: Array<{ id: string }> } | null;
} | null): boolean {
  return Boolean(data?.user && (data.user.identities?.length ?? 0) === 0);
}
