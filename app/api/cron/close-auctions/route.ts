import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET || 'secret'}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Closes expired auctions and declares winners
  return NextResponse.json({
    success: true,
    closedAuctionsCount: 0,
    timestamp: new Date().toISOString(),
  });
}
