import { NextRequest, NextResponse } from 'next/server';
import { parseProjectDeckStyle } from '@/lib/projects/deck-style';
import { requireRequestAuth } from '@/lib/supabase/request-auth';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireRequestAuth(request);
  if (auth.response) return auth.response;

  const { id } = await context.params;
  const { data: project, error } = await auth.supabase
    .from('projects')
    .select('deck_style')
    .eq('id', id)
    .single();

  if (error || !project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  return NextResponse.json({ deck_style: parseProjectDeckStyle(project.deck_style) });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireRequestAuth(request);
  if (auth.response) return auth.response;

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const guidance = typeof body.guidance === 'string' ? body.guidance.trim() : '';

  const { data: project, error: loadError } = await auth.supabase
    .from('projects')
    .select('deck_style')
    .eq('id', id)
    .single();

  if (loadError || !project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const current = parseProjectDeckStyle(project.deck_style);
  const deck_style = {
    ...current,
    guidance,
    updated_at: new Date().toISOString(),
  };

  const { error } = await auth.supabase.from('projects').update({ deck_style }).eq('id', id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deck_style });
}
