import type { NextRequest } from 'next/server';
import { applyNoStoreHeaders } from '@/lib/auth/cache-control';
import { createRouteHandlerClient, redirectPost } from '@/lib/supabase/route-handler';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  let response = redirectPost(request, '/login');
  const supabase = createRouteHandlerClient(request, response);
  await supabase.auth.signOut();
  return applyNoStoreHeaders(response);
}
