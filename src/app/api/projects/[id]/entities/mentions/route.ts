import { NextResponse } from 'next/server';
import { getProject } from '@/lib/data/queries';
import { getEntityMentions } from '@/lib/entities/mentions';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name')?.trim();
  const typeParam = searchParams.get('type');
  const includeSubProjects = searchParams.get('includeSubProjects') === 'true';

  if (!name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const project = await getProject(id);
  if (!project) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const type = typeParam === 'facility' ? 'facility' : 'person';
  const result = await getEntityMentions(id, name, { includeSubProjects, type });

  return NextResponse.json(result);
}
