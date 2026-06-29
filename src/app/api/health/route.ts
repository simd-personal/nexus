import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from('profiles').select('user_id').limit(1);
    if (error) {
      return NextResponse.json({ ok: false, db: 'error' }, { status: 503 });
    }
    return NextResponse.json({ ok: true, db: 'up' });
  } catch {
    return NextResponse.json({ ok: false, db: 'error' }, { status: 503 });
  }
}
