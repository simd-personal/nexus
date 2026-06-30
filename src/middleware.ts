import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Run session refresh on JSON API routes; skip multipart upload/replace paths
     * so middleware never touches large POST bodies.
     */
    '/((?!_next/static|_next/image|favicon.ico|api/upload|api/files/.+/replace|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
