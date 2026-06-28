import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildProjectInboundAddress } from '@/lib/inbound/addresses';

export async function GET(
  _request: Request,
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

  const { data: project } = await supabase
    .from('projects')
    .select('id, inbound_token, client_name, project_name')
    .eq('id', id)
    .single();

  if (!project?.inbound_token) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  return NextResponse.json({
    address: buildProjectInboundAddress(project.inbound_token),
    client_name: project.client_name,
    project_name: project.project_name,
    subject_hint: `[${project.client_name} · ${project.project_name}]`,
  });
}
