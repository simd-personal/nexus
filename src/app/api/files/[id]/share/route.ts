import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { shareFileToProject } from '@/lib/files/actions';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const targetProjectId = typeof body.target_project_id === 'string' ? body.target_project_id : '';
  if (!targetProjectId) {
    return NextResponse.json({ error: 'target_project_id is required' }, { status: 400 });
  }

  const result = await shareFileToProject(supabase, id, targetProjectId);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status ?? 500 });
  }

  return NextResponse.json({ data: result.file });
}
