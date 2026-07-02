import { NextRequest, NextResponse } from 'next/server';
import { requireRequestAuth } from '@/lib/supabase/request-auth';
import { deleteUserAccount } from '@/lib/account/delete-account';

/**
 * Permanently deletes the signed-in user's account. Used by the web settings
 * danger zone and the mobile app (bearer token auth).
 */
export async function POST(request: NextRequest) {
  const auth = await requireRequestAuth(request);
  if (auth.response) return auth.response;

  const body = (await request.json().catch(() => ({}))) as { confirm?: string };
  if (body.confirm !== 'DELETE') {
    return NextResponse.json(
      { error: 'Confirmation required. Send { "confirm": "DELETE" }.' },
      { status: 400 }
    );
  }

  const result = await deleteUserAccount(auth.user.id);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status ?? 500 });
  }

  // Clear the browser session cookies (no-op for bearer-token clients).
  try {
    await auth.supabase.auth.signOut({ scope: 'local' });
  } catch {
    // Session is already gone server-side; ignore.
  }

  return NextResponse.json({ success: true });
}
