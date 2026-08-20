import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: auctionId } = await params;
    const body = await request.json();
    const { amount, bidderId } = body;

    // 1. Basic input validation
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'A valid bid amount greater than 0 is required.' },
        { status: 400 }
      );
    }

    if (!bidderId) {
      return NextResponse.json(
        { success: false, error: 'Bidder ID (bidderId) is required.' },
        { status: 400 }
      );
    }

    // 2. Atomic PostgreSQL Transaction
    const result = await prisma.$transaction(async (tx) => {
      // Find auction within current transaction lock
      const existingAuction = await tx.auction.findUnique({
        where: { id: auctionId },
        include: {
          bids: true,
        },
      });

      if (!existingAuction) {
        throw { status: 404, message: 'Auction not found.' };
      }

      // Check auction status and expiration
      const isEnded =
        existingAuction.status !== 'ACTIVE' ||
        new Date(existingAuction.endTime) <= new Date();

      if (isEnded) {
        throw { status: 400, message: 'This auction has already ended.' };
      }

      // Validate minimum bid increment requirements
      const minRequired = existingAuction.currentPrice + existingAuction.minIncrement;
      if (amount < minRequired) {
        throw {
          status: 409,
          message: `Bid must be at least $${minRequired.toFixed(2)} (Current high bid: $${existingAuction.currentPrice.toFixed(2)} + min increment: $${existingAuction.minIncrement.toFixed(2)}).`,
        };
      }

      // Create new Bid record in PostgreSQL
      const newBid = await tx.bid.create({
        data: {
          amount,
          auctionId,
          userId: bidderId,
        },
        include: {
          user: {
            select: { name: true, avatar: true },
          },
        },
      });

      // Update Auction with new highest bid & price
      const updatedAuction = await tx.auction.update({
        where: { id: auctionId },
        data: {
          currentPrice: amount,
          highestBidderId: bidderId,
        },
        include: {
          bids: true,
        },
      });

      return { newBid, updatedAuction };
    });

    return NextResponse.json({
      success: true,
      message: 'Bid placed successfully!',
      data: {
        bid: {
          id: result.newBid.id,
          amount: result.newBid.amount,
          bidderId: result.newBid.userId,
          bidderName: result.newBid.user.name,
          timestamp: result.newBid.timestamp,
        },
        auction: {
          id: result.updatedAuction.id,
          currentHighestBid: result.updatedAuction.currentPrice,
          bidsCount: result.updatedAuction.bids.length,
          status: result.updatedAuction.status,
        },
      },
    });
  } catch (error: any) {
    console.error('Error placing bid:', error);

    if (error?.status && error?.message) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error while processing bid.' },
      { status: 500 }
    );
  }
}