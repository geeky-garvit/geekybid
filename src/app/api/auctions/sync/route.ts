// src/app/api/auctions/sync/route.ts
import { NextResponse } from 'next/server';
import { syncAndSimulateAuctions } from '@/lib/auction-engine';

export async function GET() {
  try {
    // Sync store state, close expired listings, & run live simulation
    const auctions = await syncAndSimulateAuctions();

    // Return real-time auction data with no-cache headers
    return NextResponse.json(
      { success: true, auctions },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (error) {
    console.error('Failed to sync auctions:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to synchronize auction state' },
      { status: 500 }
    );
  }
}