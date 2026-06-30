import { NextResponse } from 'next/server';
import { getProductTourBootstrap } from '@/lib/actions/tour';

export async function GET() {
  const bootstrap = await getProductTourBootstrap();
  if (!bootstrap) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json(bootstrap);
}
