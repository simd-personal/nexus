export type LoginMode = 'signin' | 'signup' | 'forgot';

export function parseLoginMode(value: string | undefined): LoginMode {
  if (value === 'signup' || value === 'forgot') return value;
  return 'signin';
}

export function loginHref(opts?: {
  mode?: LoginMode;
  plan?: string | null;
  error?: 'auth' | 'credentials' | 'confirm';
  message?: string;
}): string {
  const params = new URLSearchParams();
  if (opts?.mode && opts.mode !== 'signin') params.set('mode', opts.mode);
  if (opts?.plan) params.set('plan', opts.plan);
  if (opts?.error) params.set('error', opts.error);
  if (opts?.message) params.set('message', opts.message);
  const qs = params.toString();
  return qs ? `/login?${qs}` : '/login';
}

export function resolveLoginMode(input: {
  mode?: string;
  plan?: string;
}): LoginMode {
  // An explicit mode always wins; a plan deep link defaults to signup.
  if (input.mode === 'signin' || input.mode === 'signup' || input.mode === 'forgot') {
    return input.mode;
  }
  if (input.plan === 'pro' || input.plan === 'pro-annual') return 'signup';
  return parseLoginMode(input.mode);
}
