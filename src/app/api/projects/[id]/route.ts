import { NextRequest, NextResponse } from 'next/server';
import { deleteProjectAndFiles } from '@/lib/projects/delete-project';
import { requireRequestAuth } from '@/lib/supabase/request-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRequestAuth(request);
  if (auth.response) return auth.response;

  const { id } = await params;
  const { supabase } = auth;

  const { data: project, error } = await supabase
    .from('projects')
    .select('id, client_name, project_name, last_summary, status, last_activity_at')
    .eq('id', id)
    .single();

  if (error || !project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  return NextResponse.json(project);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRequestAuth(request);
  if (auth.response) return auth.response;

  const { id } = await params;
  const result = await deleteProjectAndFiles(auth.supabase, id, auth.user.id);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status ?? 500 });
  }

  return NextResponse.json({
    success: true,
    deleted_files: result.deletedFiles ?? 0,
  });
}
