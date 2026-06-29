import LoginPageClient from './LoginPageClient';

export const dynamic = 'force-dynamic';

type LoginSearchParams = {
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

  return (
    <LoginPageClient
      initialMode={hasCheckoutPlan ? 'signup' : 'signin'}
      authError={params.error === 'auth'}
      checkoutPlan={hasCheckoutPlan ? checkoutPlan : null}
    />
  );
}
