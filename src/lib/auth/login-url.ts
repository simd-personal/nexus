export type LoginMode = 'signin' | 'signup' | 'forgot';

export function parseLoginMode(value: string | undefined): LoginMode {
  if (value === 'signup' || value === 'forgot') return value;
  return 'signin';
}

export function loginHref(opts?: {
  mode?: LoginMode;
  plan?: string | null;
  error?: 'auth';
}): string {
  const params = new URLSearchParams();
  if (opts?.mode && opts.mode !== 'signin') params.set('mode', opts.mode);
  if (opts?.plan) params.set('plan', opts.plan);
  if (opts?.error === 'auth') params.set('error', 'auth');
  const qs = params.toString();
  return qs ? `/login?${qs}` : '/login';
}

export function resolveLoginMode(input: {
  mode?: string;
  plan?: string;
}): LoginMode {
  if (input.plan === 'pro' || input.plan === 'pro-annual') return 'signup';
  return parseLoginMode(input.mode);
}
