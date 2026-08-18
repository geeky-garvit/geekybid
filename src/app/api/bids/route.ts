import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma, logUserActivity } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    // 1. Verify User Session
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as any;
    const user = await prisma.user.findUnique({
      where: { email: decoded.email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User account not found.' },
        { status: 404 }
      );
    }

    // 2. Validate Body
    const body = await request.json().catch(() => null);
    const { auctionId, amount } = body || {};

    if (!auctionId || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid auctionId or bid amount.' },
        { status: 400 }
      );
    }

    // 3. Fetch Auction from SQL
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
    });

    if (!auction) {
      return NextResponse.json(
        { success: false, message: 'Auction not found.' },
        { status: 404 }
      );
    }

    if (auction.sellerId === user.id) {
      return NextResponse.json(
        { success: false, message: 'You cannot bid on your own auction.' },
        { status: 400 }
      );
    }

    if (amount <= auction.currentPrice) {
      return NextResponse.json(
        {
          success: false,
          message: `Bid must be higher than current price of $${auction.currentPrice.toLocaleString()}.`,
        },
        { status: 400 }
      );
    }

    // 4. Atomic SQL Transaction (Record Bid + Update Auction Price + Log Activity)
    const [bid] = await prisma.$transaction([
      prisma.bid.create({
        data: {
          amount,
          auctionId: auction.id,
          userId: user.id,
        },
      }),
      prisma.auction.update({
        where: { id: auction.id },
        data: {
          currentPrice: amount,
          highestBidderId: user.id,
        },
      }),
    ]);

    await logUserActivity({
      userId: user.id,
      action: 'BID_PLACED',
      amount,
      details: `Placed bid of $${amount} on "${auction.title}"`,
    });

    return NextResponse.json({
      success: true,
      message: 'Bid placed successfully!',
      currentPrice: amount,
    });
  } catch (error: any) {
    console.error('SQL Bidding Error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to place bid.' },
      { status: 500 }
    );
  }
}