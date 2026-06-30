import { NextRequest, NextResponse } from 'next/server';
import { requireRequestAuth } from '@/lib/supabase/request-auth';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireRequestAuth(request);
  if (auth.response) return auth.response;

  const { id } = await context.params;
  const { data: files, error } = await auth.supabase
    .from('files')
    .select('id, project_id, file_name, file_type, source_type, status, created_at, user_note, origin_file_id')
    .eq('project_id', id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ files: files ?? [] }, { headers: { 'Cache-Control': 'no-store' } });
}
