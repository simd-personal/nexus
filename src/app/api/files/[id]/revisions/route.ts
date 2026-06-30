import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { FileRevision } from '@/types/database';

export async function GET(
  _request: NextRequest,
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

  const { data: file, error: fileError } = await supabase
    .from('files')
    .select('id, project_id')
    .eq('id', id)
    .single();

  if (fileError || !file) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  const { data: revisions, error } = await supabase
    .from('file_revisions')
    .select('*')
    .eq('file_id', id)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: (revisions ?? []) as FileRevision[] });
}
