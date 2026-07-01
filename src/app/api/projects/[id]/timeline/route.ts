import { NextRequest, NextResponse } from 'next/server';
import { getProject, getProjectTimeline } from '@/lib/data/queries';
import { requireRequestAuth } from '@/lib/supabase/request-auth';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireRequestAuth(request);
  if (auth.response) return auth.response;

  const { id } = await context.params;
  const project = await getProject(id, auth.supabase);
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const events = await getProjectTimeline(id, {
    includeSubProjects: !project.parent_project_id,
    supabase: auth.supabase,
  });

  return NextResponse.json({ events });
}
