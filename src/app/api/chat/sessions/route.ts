import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sessionType = request.nextUrl.searchParams.get('type') ?? 'project';
  const projectId = request.nextUrl.searchParams.get('project_id');

  let query = supabase
    .from('chat_sessions')
    .select('id, title, project_id, session_type, created_at, updated_at')
    .eq('owner_id', user.id)
    .eq('session_type', sessionType)
    .order('updated_at', { ascending: false })
    .limit(50);

  if (projectId) query = query.eq('project_id', projectId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const sessions = data ?? [];
  if (sessions.length === 0) return NextResponse.json({ sessions: [] });

  const { data: replied } = await supabase
    .from('chat_messages')
    .select('session_id')
    .in('session_id', sessions.map((s) => s.id))
    .eq('role', 'assistant');

  const repliedIds = new Set((replied ?? []).map((r) => r.session_id));
  return NextResponse.json({ sessions: sessions.filter((s) => repliedIds.has(s.id)) });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { session_type, project_id, title } = await request.json();

  const { data, error } = await supabase
    .from('chat_sessions')
    .insert({
      owner_id: user.id,
      session_type: session_type ?? 'project',
      project_id: project_id ?? null,
      title: title ?? 'New conversation',
    })
    .select('id, title, project_id, session_type, created_at, updated_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ session: data });
}
