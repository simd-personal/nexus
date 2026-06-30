import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parseDashboardPortfolioScope } from '@/lib/projects/portfolio';

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { scope?: string } | null;
  const scope = parseDashboardPortfolioScope(body?.scope ?? null);

  if (!scope) {
    return NextResponse.json({ error: 'Invalid portfolio scope' }, { status: 400 });
  }

  const { error } = await supabase
    .from('profiles')
    .update({ dashboard_portfolio: scope })
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  revalidatePath('/dashboard');
  revalidatePath('/updates');
  revalidatePath('/critical-items');
  revalidatePath('/action-items');
  revalidatePath('/settings');

  return NextResponse.json({ success: true });
}
