import { NextRequest, NextResponse } from 'next/server';
import { requireRequestAuth } from '@/lib/supabase/request-auth';
import { createServiceClient } from '@/lib/supabase/admin';
import { sanitizeUploadFileName } from '@/lib/upload/client';
import { isZipFile } from '@/lib/upload/zip-extract';
import { uploadRateLimitForPro, validateUploadByteSize } from '@/lib/upload/limits';
import { getBillingContextForUser } from '@/lib/billing/limits';
import { rateLimit } from '@/lib/security/rate-limit';
import { tooManyRequestsResponse } from '@/lib/security/messages';

const BUCKET = () => process.env.SUPABASE_STORAGE_BUCKET || 'briefnexus-files';

/**
 * Issues a short-lived signed upload URL so the browser can upload large files
 * straight to Supabase Storage, bypassing the serverless request-body limit.
 * The upload is registered via POST /api/upload/finalize afterwards.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireRequestAuth(request);
    if (auth.response) return auth.response;
    const { user, supabase } = auth;

    const body = (await request.json()) as {
      project_id?: string;
      file_name?: string;
      content_type?: string;
      size?: number;
    };

    const projectId = body.project_id;
    const rawName = body.file_name;
    const size = Number(body.size);

    if (!projectId || !rawName) {
      return NextResponse.json({ error: 'Project ID and file name required' }, { status: 400 });
    }
    if (!Number.isFinite(size) || size <= 0) {
      return NextResponse.json({ error: 'A valid file size is required' }, { status: 400 });
    }

    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const billing = await getBillingContextForUser(user.id);
    const uploadLimits = uploadRateLimitForPro(billing.isPro);
    const uploadRl = await rateLimit({
      key: `upload:user:${user.id}`,
      max: uploadLimits.max,
      windowSec: uploadLimits.windowSec,
    });
    if (!uploadRl.allowed) {
      return tooManyRequestsResponse(uploadRl.retryAfter);
    }

    const fileName = sanitizeUploadFileName(rawName);
    const kind = isZipFile(fileName, body.content_type || '') ? 'zip' : 'file';
    const sizeCheck = validateUploadByteSize(size, kind);
    if (!sizeCheck.ok) {
      return NextResponse.json({ error: sizeCheck.error }, { status: 413 });
    }

    const storagePath = `${projectId}/${Date.now()}-${fileName}`;
    const admin = createServiceClient();
    const { data, error } = await admin.storage
      .from(BUCKET())
      .createSignedUploadUrl(storagePath);

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? 'Could not create upload URL' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      bucket: BUCKET(),
      path: data.path,
      token: data.token,
    });
  } catch (error) {
    console.error('Upload sign error:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
