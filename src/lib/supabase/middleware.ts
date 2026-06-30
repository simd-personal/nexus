import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isApiRoute, isPublicApiRoute } from '@/lib/auth/api-routes';
import { applyNoStoreHeaders, isAuthPath, withNoStoreIfAuthPath } from '@/lib/auth/cache-control';
import { isPublicUnauthenticatedPath } from '@/lib/marketing/seo';

export async function updateSession(request: NextRequest) {
  // Supabase auth links (email confirm) carry a `?code=` to exchange for a
  // session. If the project's redirect allow-list sends it anywhere other than
  // our callback (e.g. the site root), forward it so the code is still
  // exchanged instead of stranding the user on a page that ignores it.
  const incomingCode = request.nextUrl.searchParams.get('code');
  if (incomingCode && request.nextUrl.pathname !== '/auth/callback') {
    const callbackUrl = request.nextUrl.clone();
    callbackUrl.pathname = '/auth/callback';
    return NextResponse.redirect(callbackUrl);
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  let user = authUser;
  if (
    authError &&
    (authError.code === 'refresh_token_not_found' ||
      authError.message.toLowerCase().includes('refresh token'))
  ) {
    await supabase.auth.signOut();
    user = null;
  }

  const pathname = request.nextUrl.pathname;

  const isAuthPage = isAuthPath(pathname);
  const isPublicRoute =
    isPublicUnauthenticatedPath(pathname) ||
    (isApiRoute(pathname) && isPublicApiRoute(pathname));

  if (isApiRoute(pathname)) {
    if (isPublicApiRoute(pathname)) {
      return applyNoStoreHeaders(withNoStoreIfAuthPath(pathname, supabaseResponse));
    }
    if (!user) {
      return applyNoStoreHeaders(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );
    }
    return applyNoStoreHeaders(supabaseResponse);
  }

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return applyNoStoreHeaders(NextResponse.redirect(url));
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    const plan = url.searchParams.get('plan');
    if (plan === 'pro' || plan === 'pro-annual') {
      url.pathname = '/upgrade';
    } else {
      url.pathname = '/dashboard';
      url.search = '';
    }
    return applyNoStoreHeaders(NextResponse.redirect(url));
  }

  return withNoStoreIfAuthPath(pathname, supabaseResponse);
}
