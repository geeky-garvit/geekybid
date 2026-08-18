import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import clientPromise from '@/lib/mongodb';
import { findUserByEmail, logUserActivity } from '@/lib/db';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auctionId = params.id;
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Please sign in to place a bid.' },
        { status: 401 }
      );
    }

    // 1. Verify User Session
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as any;
    const userDoc = await findUserByEmail(decoded.email);

    if (!userDoc) {
      return NextResponse.json(
        { success: false, message: 'User account not found.' },
        { status: 404 }
      );
    }

    // 2. Validate Request Body
    const body = await request.json().catch(() => null);
    if (!body || typeof body.amount !== 'number' || body.amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid bid amount.' },
        { status: 400 }
      );
    }

    const newBidAmount = body.amount;
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || 'auctions_db');

    // 3. Fetch Auction Details
    let auctionQuery: any = { id: auctionId };
    if (ObjectId.isValid(auctionId)) {
      auctionQuery = { $or: [{ id: auctionId }, { _id: new ObjectId(auctionId) }] };
    }

    const auction = await db.collection('auctions').findOne(auctionQuery);

    if (!auction) {
      return NextResponse.json(
        { success: false, message: 'Auction not found.' },
        { status: 404 }
      );
    }

    // 4. Validate Bid Conditions
    if (auction.sellerId === userDoc.id) {
      return NextResponse.json(
        { success: false, message: 'You cannot bid on your own auction.' },
        { status: 400 }
      );
    }

    const currentPrice = auction.currentPrice || auction.startingBid || 0;
    if (newBidAmount <= currentPrice) {
      return NextResponse.json(
        {
          success: false,
          message: `Bid must be higher than current price of $${currentPrice.toLocaleString()}.`,
        },
        { status: 400 }
      );
    }

    if (auction.status && auction.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, message: 'This auction is no longer active.' },
        { status: 400 }
      );
    }

    // 5. Save Bid Document
    const bidDoc = {
      auctionId: auction.id || auction._id.toString(),
      userId: userDoc.id,
      userName: userDoc.name,
      amount: newBidAmount,
      timestamp: new Date(),
    };

    await db.collection('bids').insertOne(bidDoc);

    // 6. Update Auction's Current Price & Highest Bidder
    await db.collection('auctions').updateOne(auctionQuery, {
      $set: {
        currentPrice: newBidAmount,
        highestBidderId: userDoc.id,
        highestBidderName: userDoc.name,
        updatedAt: new Date(),
      },
    });

    // 7. Log Activity in MongoDB
    await logUserActivity({
      userId: userDoc.id,
      action: 'BID_PLACED',
      auctionId: auction.id || auction._id.toString(),
      amount: newBidAmount,
      details: `Placed a bid of $${newBidAmount.toLocaleString()} on "${auction.title || 'Auction Item'}"`,
    });

    return NextResponse.json({
      success: true,
      message: 'Bid placed successfully!',
      currentPrice: newBidAmount,
    });
  } catch (error: any) {
    console.error('Bidding Error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to place bid.' },
      { status: 500 }
    );
  }
}