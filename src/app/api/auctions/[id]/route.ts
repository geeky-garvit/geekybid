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

    const formattedAuction = {
      id: auction.id,
      title: auction.title,
      description: auction.description,
      category: auction.category,
      startingBid: auction.startingBid,
      currentHighestBid: auction.currentPrice,
      minIncrement: auction.minIncrement,
      status: auction.status,
      images: auction.images,
      attributes: auction.attributes,
      endTime: auction.endTime,
      sellerId: auction.sellerId,
      sellerName: auction.seller?.name || 'Seller',
      bidsCount: auction.bids.length,
      bids: auction.bids.map((b) => ({
        id: b.id,
        amount: b.amount,
        timestamp: b.timestamp,
        bidderName: b.user.name,
        bidderAvatar: b.user.avatar,
      })),
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