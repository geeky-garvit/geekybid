import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const auction = await prisma.auction.findUnique({
      where: { id },
      include: {
        seller: {
          select: { id: true, name: true, avatar: true },
        },
        bids: {
          orderBy: { timestamp: 'desc' },
          include: {
            user: {
              select: { id: true, name: true, avatar: true },
            },
          },
        },
      },
    });

    if (!auction) {
      return NextResponse.json({ error: 'Auction not found in database' }, { status: 404 });
    }

    // Map database status to the front-end union type: 'live' | 'ended' | 'paid'
    let mappedStatus: 'live' | 'ended' | 'paid' = 'live';
    const normalizedStatus = auction.status.toLowerCase();

    if (normalizedStatus === 'ended' || normalizedStatus === 'closed') {
      mappedStatus = 'ended';
    } else if (normalizedStatus === 'paid' || normalizedStatus === 'completed') {
      mappedStatus = 'paid';
    } else if (new Date(auction.endTime) <= new Date()) {
      mappedStatus = 'ended';
    }

    const formattedAuction = {
      id: auction.id,
      title: auction.title,
      description: auction.description,
      category: auction.category,
      startingBid: auction.startingBid,
      startingPrice: auction.startingBid,
      currentHighestBid: auction.currentPrice,
      minIncrement: auction.minIncrement,
      status: mappedStatus,
      images: auction.images,
      attributes: auction.attributes,
      endTime: auction.endTime.toISOString(),
      sellerId: auction.sellerId,
      sellerName: auction.seller?.name || 'Seller',
      sellerAvatar: auction.seller?.avatar || '',
      bidsCount: auction.bids.length,
      history: auction.bids.map((b) => {
        const isoTimeString = b.timestamp.toISOString();
        return {
          id: b.id,
          amount: b.amount,
          time: isoTimeString,
          timestamp: isoTimeString,
          bidderId: b.userId,
          bidderName: b.user?.name || 'Anonymous',
          bidderAvatar: b.user?.avatar || '',
        };
      }),
    };

    return NextResponse.json(
      { auction: formattedAuction },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (error) {
    console.error('Error fetching auction by ID:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}