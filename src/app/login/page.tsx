import LoginPageClient from './LoginPageClient';
import { resolveLoginMode } from '@/lib/auth/login-url';

export const dynamic = 'force-dynamic';

type LoginSearchParams = {
  mode?: string;
  plan?: string;
  error?: string;
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<LoginSearchParams>;
}) {
  const params = await searchParams;
  const checkoutPlan = params.plan;
  const hasCheckoutPlan = checkoutPlan === 'pro' || checkoutPlan === 'pro-annual';
  const mode = resolveLoginMode(params);

  return (
    <LoginPageClient
      mode={mode}
      authError={params.error === 'auth'}
      checkoutPlan={hasCheckoutPlan ? checkoutPlan : null}
    />
  );
}
