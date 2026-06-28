import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getProjectChatMessages } from '@/lib/data/queries';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const messages = await getProjectChatMessages(id);
  return NextResponse.json({ messages });
}
