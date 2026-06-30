import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getProjectsWithStats } from '@/lib/data/queries';
import {
  createProjectForUser,
  createProjectInputFromFormData,
} from '@/lib/projects/create-project-core';

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

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const input = createProjectInputFromFormData(formData);
  const result = await createProjectForUser(supabase, user, input);

  if (result.error) {
    return NextResponse.json(
      { error: result.error, upgradeRequired: result.upgradeRequired ?? false },
      { status: result.upgradeRequired ? 402 : 400 }
    );
  }

  revalidatePath('/dashboard');
  revalidatePath('/projects');
  revalidatePath('/getting-started');
  if (input.parentProjectId) revalidatePath(`/projects/${input.parentProjectId}/overview`);

  return NextResponse.json(result);
}
