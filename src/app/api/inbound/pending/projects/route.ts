import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: projects } = await supabase
    .from('projects')
    .select('id, client_name, project_name, parent_project_id')
    .order('client_name', { ascending: true })
    .order('project_name', { ascending: true });

  return NextResponse.json({
    projects: (projects ?? []).map((project) => ({
      id: project.id,
      label: `${project.client_name} · ${project.project_name}`,
    })),
  });
}
