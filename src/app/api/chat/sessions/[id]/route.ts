import { NextRequest, NextResponse } from 'next/server';
import { requireRequestAuth } from '@/lib/supabase/request-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRequestAuth(request);
  if (auth.response) return auth.response;

  const { id } = await params;
  const { user, supabase } = auth;

  const { data: session } = await supabase
    .from('chat_sessions')
    .select('id, title, project_id, session_type')
    .eq('id', id)
    .eq('owner_id', user.id)
    .single();

  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: messages } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('session_id', id)
    .order('created_at', { ascending: true });

  return NextResponse.json({
    session,
    messages: (messages ?? []).map((m) => ({
      ...m,
      citations: m.citations ?? [],
    })),
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRequestAuth(request);
  if (auth.response) return auth.response;

  const { id } = await params;
  const { user, supabase } = auth;

  const { error } = await supabase
    .from('chat_sessions')
    .delete()
    .eq('id', id)
    .eq('owner_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
