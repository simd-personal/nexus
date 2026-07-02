import type { NextRequest } from 'next/server';
import { applyNoStoreHeaders } from '@/lib/auth/cache-control';
import {
  isDuplicateSignUp,
  isEmailRateLimitError,
  mapAuthErrorMessage,
} from '@/lib/auth/auth-errors';
import { BLOCKED_SIGNUP_MESSAGE, isEmailBlockedFromSignup } from '@/lib/auth/deleted-accounts';
import { recoverAccountAfterEmailRateLimit } from '@/lib/auth/email-rate-limit-recovery';
import { loginHref } from '@/lib/auth/login-url';
import { getSiteUrlFromRequest } from '@/lib/auth/site-url';
import { sendWelcomeEmail } from '@/lib/email/send-welcome';
import { createRouteHandlerClient, redirectPost } from '@/lib/supabase/route-handler';

export const dynamic = 'force-dynamic';

function signupRedirect(request: NextRequest, checkoutPlan: string | null, immediate: boolean) {
  if (checkoutPlan === 'pro' || checkoutPlan === 'pro-annual') {
    return redirectPost(request, `/upgrade?plan=${checkoutPlan}`);
  }
  if (immediate) {
    return redirectPost(request, '/getting-started');
  }
  return redirectPost(
    request,
    loginHref({
      mode: 'signin',
      plan: checkoutPlan,
      message: 'Account created. Check your email to confirm your address, then sign in.',
    })
  );
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const fullName = String(formData.get('fullName') ?? '').trim();
  const checkoutPlan = formData.get('plan') ? String(formData.get('plan')) : null;
  const hasCheckoutPlan = checkoutPlan === 'pro' || checkoutPlan === 'pro-annual';

  if (!email || !fullName || !password) {
    return applyNoStoreHeaders(
      redirectPost(
        request,
        loginHref({
          mode: 'signup',
          plan: checkoutPlan,
          message: 'Name, email, and password are required.',
        })
      )
    );
  }

  if (password.length < 8) {
    return applyNoStoreHeaders(
      redirectPost(
        request,
        loginHref({
          mode: 'signup',
          plan: checkoutPlan,
          message: 'Password must be at least 8 characters.',
        })
      )
    );
  }

  if (await isEmailBlockedFromSignup(email)) {
    return applyNoStoreHeaders(
      redirectPost(
        request,
        loginHref({
          mode: 'signup',
          plan: checkoutPlan,
          message: BLOCKED_SIGNUP_MESSAGE,
        })
      )
    );
  }

  const siteUrl = getSiteUrlFromRequest(request);
  const emailRedirectTo = `${siteUrl}/auth/callback`;
  const userMetadata: Record<string, string> = {
    full_name: fullName,
    account_type: 'individual',
  };
  if (hasCheckoutPlan) {
    userMetadata.pending_checkout_plan = checkoutPlan;
  }

  let response = redirectPost(
    request,
    hasCheckoutPlan ? `/upgrade?plan=${checkoutPlan}` : '/getting-started'
  );
  const supabase = createRouteHandlerClient(request, response);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: userMetadata,
      emailRedirectTo,
    },
  });

  if (error) {
    if (isEmailRateLimitError(error.message)) {
      const recovery = await recoverAccountAfterEmailRateLimit({ email, password, fullName });
      if (recovery.recovered) {
        response = redirectPost(
          request,
          loginHref({ mode: 'signin', plan: checkoutPlan, message: recovery.message })
        );
        return applyNoStoreHeaders(response);
      }
    }

    response = redirectPost(
      request,
      loginHref({
        mode: 'signup',
        plan: checkoutPlan,
        message: mapAuthErrorMessage(error.message),
      })
    );
    return applyNoStoreHeaders(response);
  }

  if (isDuplicateSignUp(data)) {
    const recovery = await recoverAccountAfterEmailRateLimit({ email, password, fullName });
    if (recovery.recovered) {
      response = redirectPost(
        request,
        loginHref({ mode: 'signin', plan: checkoutPlan, message: recovery.message })
      );
      return applyNoStoreHeaders(response);
    }

    response = redirectPost(
      request,
      loginHref({
        mode: 'signup',
        plan: checkoutPlan,
        message:
          'An account with this email already exists. Sign in instead, or use Forgot password if you need help.',
      })
    );
    return applyNoStoreHeaders(response);
  }

  if (data.session) {
    await sendWelcomeEmail({ email, fullName });
    return applyNoStoreHeaders(response);
  }

  response = signupRedirect(request, checkoutPlan, false);
  return applyNoStoreHeaders(response);
}
