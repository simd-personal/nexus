import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedCronRequest } from '@/lib/cron/auth';
import { sweepStaleFiles } from '@/lib/processing/sweep-stale-files';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const started = Date.now();
  const result = await sweepStaleFiles();
  return NextResponse.json({
    ...result,
    duration_ms: Date.now() - started,
  });
}
