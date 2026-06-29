import type { NextRequest } from 'next/server';
import { applyNoStoreHeaders } from '@/lib/auth/cache-control';
import { mapAuthErrorMessage } from '@/lib/auth/auth-errors';
import { loginHref } from '@/lib/auth/login-url';
import { safeAuthNextPath } from '@/lib/auth/site-url';
import { createRouteHandlerClient, redirectPost } from '@/lib/supabase/route-handler';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const redirectPath = safeAuthNextPath(String(formData.get('redirect') ?? '/dashboard'));
  const plan = formData.get('plan');
  const planParam = plan ? String(plan) : null;

  if (!email || !password) {
    return applyNoStoreHeaders(
      redirectPost(
        request,
        loginHref({ mode: 'signin', plan: planParam, error: 'credentials', message: 'Email and password are required.' })
      )
    );
  }

  let response = redirectPost(request, redirectPath);
  const supabase = createRouteHandlerClient(request, response);
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    response = redirectPost(
      request,
      loginHref({
        mode: 'signin',
        plan: planParam,
        error: 'credentials',
        message: mapAuthErrorMessage(error.message),
      })
    );
    return applyNoStoreHeaders(response);
  }

  return applyNoStoreHeaders(response);
}
