import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const bids = [
    { id: 'b1', bidder: 'a***r', amount: 250, time: new Date(Date.now() - 120000).toISOString() },
    { id: 'b2', bidder: 'k***n', amount: 240, time: new Date(Date.now() - 900000).toISOString() },
    { id: 'b3', bidder: 'm***x', amount: 220, time: new Date(Date.now() - 3600000).toISOString() },
  ];

  return NextResponse.json({ auctionId: id, bids });
}
