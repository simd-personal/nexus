import { NextRequest, NextResponse } from 'next/server';
import { parseProjectDeckStyle } from '@/lib/projects/deck-style';
import { ingestProjectFileUpload } from '@/lib/upload/ingest-file';
import { requireRequestAuth } from '@/lib/supabase/request-auth';

const TEMPLATE_ACCEPT = /\.(pdf|pptx|ppt|docx|key)$/i;

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireRequestAuth(request);
  if (auth.response) return auth.response;

  const { id: projectId } = await context.params;
  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Template file required' }, { status: 400 });
  }

  if (!TEMPLATE_ACCEPT.test(file.name)) {
    return NextResponse.json(
      { error: 'Upload a PDF, PowerPoint, Word, or Keynote template file.' },
      { status: 400 }
    );
  }

  const { data: project, error: loadError } = await auth.supabase
    .from('projects')
    .select('deck_style')
    .eq('id', projectId)
    .single();

  if (loadError || !project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ingested = await ingestProjectFileUpload({
    supabase: auth.supabase,
    projectId,
    userId: auth.user.id,
    fileName: file.name,
    buffer,
    mimeType: file.type || 'application/octet-stream',
    userNote: 'Company deck template for this project',
    extraMetadata: { deck_template: true },
  });

  if ('error' in ingested) {
    return NextResponse.json({ error: ingested.error }, { status: 500 });
  }

  const current = parseProjectDeckStyle(project.deck_style);
  const deck_style = {
    ...current,
    template_file_id: ingested.fileId,
    template_file_name: file.name,
    updated_at: new Date().toISOString(),
  };

  const { error: updateError } = await auth.supabase
    .from('projects')
    .update({ deck_style })
    .eq('id', projectId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ deck_style, file_id: ingested.fileId });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireRequestAuth(request);
  if (auth.response) return auth.response;

  const { id: projectId } = await context.params;
  const { data: project, error: loadError } = await auth.supabase
    .from('projects')
    .select('deck_style')
    .eq('id', projectId)
    .single();

  if (loadError || !project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const current = parseProjectDeckStyle(project.deck_style);
  const deck_style = {
    ...current,
    template_file_id: null,
    template_file_name: null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await auth.supabase.from('projects').update({ deck_style }).eq('id', projectId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deck_style });
}
