import { NextResponse } from 'next/server';
import { getAuctionById, initializeStore } from '@/lib/store';

export async function GET(
  _request: Request,
  { params }: RouteContext<'/api/auctions/[id]'>
) {
  await initializeStore();
  const { id } = await params;
  const auction = getAuctionById(id);

  if (!auction) {
    return NextResponse.json({ error: 'Auction not found' }, { status: 404 });
  }

  return NextResponse.json({ auction });
}
