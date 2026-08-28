import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma, logUserActivity } from '@/lib/db';
import { type TransactionClient } from '@/lib/db';
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // 1. Typed as Promise for Next.js 15+
) {
  try {
    // 2. Await params before destructuring
    const { id: auctionId } = await params;

    if (!auctionId) {
      return NextResponse.json(
        { success: false, message: 'Auction ID is missing from request.' },
        { status: 400 }
      );
    }

    // 3. Authenticate via Cookie
    const token =
      request.cookies.get('token')?.value ||
      request.cookies.get('user_session')?.value;

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

    const userId = decoded.id || decoded.userId;
    const userEmail = decoded.email;

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          ...(userEmail ? [{ email: userEmail }] : []),
          ...(userId ? [{ id: userId }] : []),
        ],
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User account not found.' },
        { status: 404 }
      );
    }

    // 4. Parse Request Body
    const body = await request.json().catch(() => null);
    const { amount } = body || {};

    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Valid numeric bid amount is required.' },
        { status: 400 }
      );
    }

    // 5. Atomic Prisma Transaction
    const result = await prisma.$transaction(
      async (tx: TransactionClient) => {
        const auction = await tx.auction.findUnique({
          where: { id: auctionId },
        });

        if (!auction) {
          throw new Error('NOT_FOUND');
        }

        if (auction.sellerId === user.id) {
          throw new Error('SELF_BIDDING');
        }

        const isEnded =
          auction.status === 'ENDED' ||
          auction.status === 'PAID' ||
          (auction.endTime && new Date(auction.endTime).getTime() <= Date.now());

        if (isEnded) {
          throw new Error('AUCTION_ENDED');
        }

        const minIncrement = auction.minIncrement || 1;
        const currentHighPrice = auction.currentPrice ?? auction.startingBid ?? 0;
        const minRequiredBid = currentHighPrice + minIncrement;

        if (amount < minRequiredBid) {
          throw new Error(`BID_TOO_LOW:$${minRequiredBid.toFixed(2)}`);
        }

        // Conditional optimistic update
        const updatedAuction = await tx.auction.updateMany({
          where: {
            id: auction.id,
            currentPrice: auction.currentPrice,
          },
          data: {
            currentPrice: amount,
            highestBidderId: user.id,
          },
        });

        if (updatedAuction.count === 0) {
          throw new Error('RACE_CONDITION_RETRY');
        }

        const newBid = await tx.bid.create({
          data: {
            amount,
            auctionId: auction.id,
            userId: user.id,
          },
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
        });

        const totalBids = await tx.bid.count({
          where: { auctionId: auction.id },
        });

        return { newBid, currentPrice: amount, totalBids, title: auction.title };
      },
      { isolationLevel: 'Serializable' }
    );

    // 6. Log Activity
    if (typeof logUserActivity === 'function') {
      await logUserActivity({
        userId: user.id,
        action: 'BID_PLACED',
        amount,
        details: `Placed bid of $${amount} on "${result.title}"`,
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
          timestamp: new Date().toISOString(),
        },
        auction: {
          id: auctionId,
          currentHighestBid: result.currentPrice,
          bidsCount: result.totalBids,
        },
      },
    });
  } catch (error: any) {
    console.error('Bidding Error:', error);
    const msg = error?.message || '';

    if (msg === 'NOT_FOUND') {
      return NextResponse.json({ success: false, message: 'Auction not found.' }, { status: 404 });
    }
    if (msg === 'SELF_BIDDING') {
      return NextResponse.json({ success: false, message: 'You cannot bid on your own auction.' }, { status: 400 });
    }
    if (msg === 'AUCTION_ENDED') {
      return NextResponse.json({ success: false, message: 'This auction has already concluded.' }, { status: 400 });
    }
    if (msg.startsWith('BID_TOO_LOW:')) {
      const minReq = msg.split(':')[1];
      return NextResponse.json({ success: false, message: `Another bid was placed! Minimum bid is now ${minReq}.` }, { status: 409 });
    }
    if (msg === 'RACE_CONDITION_RETRY') {
      return NextResponse.json({ success: false, message: 'Another user placed a bid just before you! Please try again.' }, { status: 409 });
    }

    return NextResponse.json(
      { success: false, message: 'Failed to process bid submission.' },
      { status: 500 }
    );
  }
}