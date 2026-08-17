import { NextResponse } from 'next/server';
import { getAuctionById, initializeStore } from '@/lib/store';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export async function GET(
  request: Request,
  { params }: RouteContext<'/api/auctions/[id]/bids'>
) {
  await initializeStore();
  const { id } = await params;
  const auction = getAuctionById(id);
  if (!auction) {
    return NextResponse.json({ error: 'Auction not found' }, { status: 404 });
  }

  const searchParams = new URL(request.url).searchParams;
  const requestedLimit = Number.parseInt(searchParams.get('limit') ?? '', 10);
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), MAX_LIMIT)
    : DEFAULT_LIMIT;
  const cursor = searchParams.get('cursor');
  const start = cursor ? auction.history.findIndex((bid) => bid.id === cursor) + 1 : 0;
  const items = auction.history.slice(Math.max(start, 0), Math.max(start, 0) + limit).map((bid) => ({
    ...bid,
    bidderName: maskBidderName(bid.bidderName),
  }));
  const lastBid = items.at(-1);

  return NextResponse.json({
    items,
    nextCursor: lastBid && start + limit < auction.history.length ? lastBid.id : null,
  });
}

function maskBidderName(name: string): string {
  const compact = name.trim();
  if (compact.length < 2) return '***';
  return `${compact[0]}***${compact.at(-1)}`;
}
