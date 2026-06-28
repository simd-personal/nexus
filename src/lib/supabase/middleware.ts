import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isPublicMarketingPath } from '@/lib/marketing/seo';

export async function updateSession(request: NextRequest) {
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

  const isAuthPage = pathname.startsWith('/login');
  const isPublicRoute =
    isPublicMarketingPath(pathname) ||
    pathname.startsWith('/auth') ||
    pathname === '/api/stripe/webhook';

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
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
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
