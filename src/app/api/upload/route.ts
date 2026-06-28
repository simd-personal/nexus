import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/admin';
import { processFile } from '@/lib/processing/pipeline';
import { inferSourceType } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const projectId = formData.get('project_id') as string;
    const pastedText = formData.get('pasted_text') as string | null;
    const pastedType = formData.get('pasted_type') as string | null;
    const file = formData.get('file') as File | null;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    // Verify project ownership
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'briefnexus-files';
    let fileName: string;
    let sourceType: ReturnType<typeof inferSourceType>;
    let storagePath: string | null = null;
    let buffer: Buffer | undefined;

    if (pastedText) {
      fileName = pastedType === 'email'
        ? `pasted-email-${Date.now()}.txt`
        : pastedType === 'meeting'
          ? `meeting-notes-${Date.now()}.txt`
          : pastedType === 'transcript'
            ? `call-transcript-${Date.now()}.txt`
            : `pasted-note-${Date.now()}.txt`;
      sourceType = pastedType === 'email' ? 'email' : pastedType === 'meeting' ? 'meeting' : pastedType === 'transcript' ? 'transcript' : 'note';
    } else if (file) {
      fileName = file.name;
      sourceType = inferSourceType(fileName, file.type);
      buffer = Buffer.from(await file.arrayBuffer());
      storagePath = `${projectId}/${Date.now()}-${fileName}`;

      const admin = createServiceClient();
      const { error: uploadError } = await admin.storage
        .from(bucket)
        .upload(storagePath, buffer, { contentType: file.type, upsert: false });

      if (uploadError) {
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
      }
    } else {
      return NextResponse.json({ error: 'No file or text provided' }, { status: 400 });
    }

    const { data: fileRecord, error: insertError } = await supabase
      .from('files')
      .insert({
        project_id: projectId,
        uploaded_by: user.id,
        file_name: fileName,
        file_type: file?.type ?? 'text/plain',
        source_type: sourceType,
        storage_path: storagePath,
        extracted_text: pastedText?.trim() || null,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError || !fileRecord) {
      return NextResponse.json({ error: 'Failed to create file record' }, { status: 500 });
    }

    // Process asynchronously — don't block the response
    processFile({
      fileId: fileRecord.id,
      projectId,
      fileName,
      sourceType,
      buffer,
      pastedText: pastedText ?? undefined,
    }).catch(console.error);

    return NextResponse.json({ data: fileRecord });
  } catch (error) {
    console.error('Upload error:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
