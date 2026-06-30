import { NextRequest, NextResponse } from 'next/server';
import { buildProjectInboundAddress } from '@/lib/inbound/addresses';
import { requireRequestAuth } from '@/lib/supabase/request-auth';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireRequestAuth(request);
  if (auth.response) return auth.response;

  const { id } = await context.params;
  const { data: project } = await auth.supabase
    .from('projects')
    .select('id, inbound_token, client_name, project_name')
    .eq('id', id)
    .single();

  if (!project?.inbound_token) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  return NextResponse.json(
    {
      address: buildProjectInboundAddress(project.inbound_token),
      client_name: project.client_name,
      project_name: project.project_name,
      subject_hint: `[${project.client_name} · ${project.project_name}]`,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
