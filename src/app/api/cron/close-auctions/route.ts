// app/api/cron/close-auctions/route.ts
import { NextResponse } from 'next/server';
import { closeExpiredAuctions } from '@/lib/store';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET || 'secret123'}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const closed = closeExpiredAuctions();
  return NextResponse.json({ success: true, closedCount: closed.length, closed });
}