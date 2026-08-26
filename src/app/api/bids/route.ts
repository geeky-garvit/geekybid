import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma, logUserActivity } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate via JWT Cookie
    const token = request.cookies.get('token')?.value || request.cookies.get('user_session')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Please sign in to place a bid.' },
        { status: 401 }
      );
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired session token.' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: decoded.email },
          { id: decoded.id || decoded.userId },
        ],
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User account not found.' },
        { status: 404 }
      );
    }

    // 2. Validate Request Body
    const body = await request.json().catch(() => null);
    const { auctionId: rawAuctionId, amount } = body || {};

    if (!rawAuctionId || typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid payload: valid auctionId and numeric amount are required.' },
        { status: 400 }
      );
    }

    // Sanitize string ID (handles "auction-5" -> "5")
    const cleanAuctionId = String(rawAuctionId).replace(/^auction-/i, '');

    // 3. Find Auction in DB
    const auction = await prisma.auction.findFirst({
      where: {
        OR: [
          { id: String(rawAuctionId) },
          { id: cleanAuctionId },
        ],
      },
      include: {
        bids: true,
      },
    });

    if (!auction) {
      return NextResponse.json(
        { success: false, message: `Auction with ID '${rawAuctionId}' not found.` },
        { status: 404 }
      );
    }

    // 4. Validate Business Rules & Constraints
    if (auction.sellerId === user.id) {
      return NextResponse.json(
        { success: false, message: 'You cannot place a bid on your own auction.' },
        { status: 400 }
      );
    }

    const isEnded =
      auction.status === 'ENDED' ||
      auction.status === 'PAID' ||
      (auction.endTime && new Date(auction.endTime).getTime() <= Date.now());

    if (isEnded) {
      return NextResponse.json(
        { success: false, message: 'This auction has already concluded.' },
        { status: 400 }
      );
    }

    const minIncrement = auction.minIncrement || 1;
    const currentHighPrice = auction.currentPrice ?? auction.startingBid ?? 0;
    const minRequiredBid = currentHighPrice + minIncrement;

    if (amount < minRequiredBid) {
      return NextResponse.json(
        {
          success: false,
          message: `Bid must be at least $${minRequiredBid.toFixed(2)} (Current high: $${currentHighPrice.toFixed(2)} + increment: $${minIncrement.toFixed(2)}).`,
        },
        { status: 400 }
      );
    }

    // 5. Execute Atomic SQL Transaction
    const result = await prisma.$transaction(async (tx) => {
      const newBid = await tx.bid.create({
        data: {
          amount,
          auctionId: auction.id,
          userId: user.id,
        },
        include: {
          user: {
            select: { id: true, name: true, avatar: true },
          },
        },
      });

      const updatedAuction = await tx.auction.update({
        where: { id: auction.id },
        data: {
          currentPrice: amount,
          highestBidderId: user.id,
        },
        include: {
          bids: true,
        },
      });

      return { newBid, updatedAuction };
    });

    // 6. Log Activity (Optional helper)
    if (typeof logUserActivity === 'function') {
      await logUserActivity({
        userId: user.id,
        action: 'BID_PLACED',
        amount,
        details: `Placed bid of $${amount} on "${auction.title}"`,
      }).catch((e) => console.error('Failed to log user activity:', e));
    }

    return NextResponse.json({
      success: true,
      message: 'Bid placed successfully!',
      data: {
        bid: {
          id: result.newBid.id,
          amount: result.newBid.amount,
          bidderId: result.newBid.userId,
          bidderName: result.newBid.user?.name || 'Anonymous',
          bidderAvatar: result.newBid.user?.avatar || '',
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
    console.error('SQL Bidding Error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to process bid submission.' },
      { status: 500 }
    );
  }
}