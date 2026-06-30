import { NextResponse } from 'next/server';
import { getAccountSummary } from '@/lib/account/summary';

export async function GET() {
  const summary = await getAccountSummary();

  if (!summary) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json(summary);
}
