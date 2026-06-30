import { NextRequest, NextResponse } from 'next/server';
import { requireRequestAuth } from '@/lib/supabase/request-auth';
import { shareFileToProject } from '@/lib/files/actions';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRequestAuth(request);
  if (auth.response) return auth.response;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const targetProjectId = typeof body.target_project_id === 'string' ? body.target_project_id : '';
  if (!targetProjectId) {
    return NextResponse.json({ error: 'target_project_id is required' }, { status: 400 });
  }

  const result = await shareFileToProject(auth.supabase, id, targetProjectId);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status ?? 500 });
  }

  return NextResponse.json({ data: result.file });
}
