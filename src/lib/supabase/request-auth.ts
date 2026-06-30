import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

export type RequestSupabaseClient = SupabaseClient;

export function parseBearerToken(request: Request): string | null {
  const header = request.headers.get('authorization');
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ?? null;
}

function createBearerClient(token: string): RequestSupabaseClient {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: (_cookiesToSet: { name: string; value: string; options: CookieOptions }[]) => {},
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );
}

export async function getUserFromBearerToken(token: string): Promise<User | null> {
  const client = createBearerClient(token);
  const {
    data: { user },
    error,
  } = await client.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

export async function getRequestAuth(request: Request): Promise<{
  user: User | null;
  supabase: RequestSupabaseClient;
}> {
  const cookieClient = await createClient();
  const {
    data: { user: cookieUser },
  } = await cookieClient.auth.getUser();

  if (cookieUser) {
    return { user: cookieUser, supabase: cookieClient };
  }

  const token = parseBearerToken(request);
  if (!token) {
    return { user: null, supabase: cookieClient };
  }

  const bearerClient = createBearerClient(token);
  const bearerUser = await getUserFromBearerToken(token);
  if (bearerUser) {
    return { user: bearerUser, supabase: bearerClient };
  }

  return { user: null, supabase: cookieClient };
}

export async function requireRequestAuth(request: Request): Promise<
  | { user: User; supabase: RequestSupabaseClient; response: null }
  | { user: null; supabase: null; response: NextResponse }
> {
  const auth = await getRequestAuth(request);
  if (!auth.user) {
    return {
      user: null,
      supabase: null,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }
  return { user: auth.user, supabase: auth.supabase, response: null };
}
