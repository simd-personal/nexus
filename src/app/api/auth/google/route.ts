import { createServerClient } from '@supabase/ssr';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { applyNoStoreHeaders } from '@/lib/auth/cache-control';
import { loginHref } from '@/lib/auth/login-url';
import { getAuthCallbackUrl, getSiteUrlFromRequest, safeAuthNextPath } from '@/lib/auth/site-url';
import { redirectPost } from '@/lib/supabase/route-handler';

export const dynamic = 'force-dynamic';

/**
 * Starts the Google OAuth PKCE flow. A native form POST (same pattern as
 * /api/auth/sign-in) so the code-verifier cookie is set on a 303 redirect
 * that corporate proxies honor.
 */
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const redirectPath = safeAuthNextPath(String(formData.get('redirect') ?? '/dashboard'));
  const plan = formData.get('plan') ? String(formData.get('plan')) : null;
  const hasCheckoutPlan = plan === 'pro' || plan === 'pro-annual';

  // Checkout intent survives the OAuth round-trip via the callback `next` param
  // (OAuth users have no pending_checkout_plan metadata, unlike password signup).
  const nextPath = hasCheckoutPlan ? `/upgrade?plan=${plan}` : redirectPath;
  const siteUrl = getSiteUrlFromRequest(request);
  const callbackUrl = `${getAuthCallbackUrl(siteUrl)}?next=${encodeURIComponent(nextPath)}`;

  // The Google auth URL is unknown until signInWithOAuth resolves, so collect
  // the PKCE cookies first and apply them to the final redirect response.
  const pendingCookies: Array<{ name: string; value: string; options?: object }> = [];
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          pendingCookies.push(...cookiesToSet);
        },
      },
    }
  );

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: callbackUrl,
      queryParams: {
        // Ask Google for a refresh token and account picker so switching
        // accounts works; also keeps future Drive/Gmail scope grants possible.
        access_type: 'offline',
        prompt: 'select_account',
      },
    },
  });

  if (error || !data?.url) {
    return applyNoStoreHeaders(
      redirectPost(
        request,
        loginHref({
          mode: 'signin',
          plan,
          error: 'auth',
          message: 'Google sign-in is unavailable right now. Please try again or use your password.',
        })
      )
    );
  }

  const response = NextResponse.redirect(data.url, { status: 303 });
  pendingCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });
  return applyNoStoreHeaders(response);
}
