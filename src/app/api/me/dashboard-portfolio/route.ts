import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getDashboardPortfolioPreference } from '@/lib/data/queries';
import { parseDashboardPortfolioScope } from '@/lib/projects/portfolio';
import { requireRequestAuth } from '@/lib/supabase/request-auth';

export async function GET(request: NextRequest) {
  const auth = await requireRequestAuth(request);
  if (auth.response) return auth.response;

  const scope = await getDashboardPortfolioPreference(auth.supabase);
  return NextResponse.json({ scope });
}

export async function POST(request: NextRequest) {
  const auth = await requireRequestAuth(request);
  if (auth.response) return auth.response;

  const body = (await request.json().catch(() => null)) as { scope?: string } | null;
  const scope = parseDashboardPortfolioScope(body?.scope ?? null);

  if (!scope) {
    return NextResponse.json({ error: 'Invalid portfolio scope' }, { status: 400 });
  }

  const { error } = await auth.supabase
    .from('profiles')
    .update({ dashboard_portfolio: scope })
    .eq('user_id', auth.user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  revalidatePath('/dashboard');
  revalidatePath('/updates');
  revalidatePath('/critical-items');
  revalidatePath('/action-items');
  revalidatePath('/settings');

  return NextResponse.json({ success: true, scope });
}
