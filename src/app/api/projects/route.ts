import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getProjectsWithStats } from '@/lib/data/queries';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const projects = await getProjectsWithStats();
  return NextResponse.json({
    projects: projects.map((project) => ({
      id: project.id,
      client_name: project.client_name,
      project_name: project.project_name,
    })),
  });
}
