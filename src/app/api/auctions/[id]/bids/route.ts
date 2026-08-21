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

    // Ensure bidder exists in database before placing bid
    const bidderExists = await prisma.user.findUnique({
      where: { id: bidderId },
    });

    if (!bidderExists) {
      await prisma.user.create({
        data: {
          id: bidderId,
          name: 'Bidder',
          email: `${bidderId}@example.com`,
          password: '$2a$10$abcdefghijklmnopqrstuu',
          avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Bidder',
        },
      });
    }

    // 2. Atomic PostgreSQL Transaction
    const result = await prisma.$transaction(async (tx) => {
      const existingAuction = await tx.auction.findUnique({
        where: { id: auctionId },
        include: {
          bids: true,
        },
      });

      if (!existingAuction) {
        throw { status: 404, message: 'Auction not found in database.' };
      }

      const isEnded =
        existingAuction.status !== 'ACTIVE' ||
        new Date(existingAuction.endTime) <= new Date();

      if (isEnded) {
        throw { status: 400, message: 'This auction has already ended.' };
      }

      const minRequired = existingAuction.currentPrice + existingAuction.minIncrement;
      if (amount < minRequired) {
        throw {
          status: 409,
          message: `Bid must be at least $${minRequired.toFixed(2)} (Current high bid: $${existingAuction.currentPrice.toFixed(2)} + min increment: $${existingAuction.minIncrement.toFixed(2)}).`,
        };
      }

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