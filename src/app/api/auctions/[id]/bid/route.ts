import { NextRequest, NextResponse } from 'next/server';
import { prisma, type TransactionClient } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: auctionId } = await params;
    const body = await request.json();
    const { userId, amount } = body;

    if (!userId || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid payload provided' },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx: TransactionClient) => {
      const auction = await tx.auction.findUnique({
        where: { id: auctionId },
      });

      if (!auction || auction.status !== 'ACTIVE') {
        throw new Error('Auction is not active or does not exist');
      }

      const minBid = (auction.currentPrice ?? auction.startingBid) + auction.minIncrement;
      if (amount < minBid) {
        throw new Error(`Bid amount must be at least $${minBid.toFixed(2)}`);
      }

      const bid = await tx.bid.create({
        data: {
          amount,
          auctionId,
          userId,
        },
      });

      await tx.auction.update({
        where: { id: auctionId },
        data: {
          currentPrice: amount,
          highestBidderId: userId,
        },
      });

      return bid;
    });

    return NextResponse.json({ success: true, bid: result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to place bid' },
      { status: 400 }
    );
  }
}