import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { Auction } from '@/types/auction';

const DB_NAME = process.env.MONGODB_DB || 'auctions_db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { amount, bidderId, bidderName } = body;

    // 1. Basic validation
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'A valid bid amount greater than 0 is required.' },
        { status: 400 }
      );
    }

    if (!bidderId || !bidderName) {
      return NextResponse.json(
        { success: false, error: 'Bidder information (bidderId and bidderName) is required.' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection<Auction>('auctions');

    const newBid = {
      id: `bid_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      amount,
      bidderId,
      bidderName,
      timestamp: new Date(),
    };

    // 2. Atomic Find and Update
    // Conditions enforced atomically:
    // - Item ID matches
    // - Status is live
    // - End time has not passed
    // - New bid amount is GREATER than current highest bid
    const updatedAuction = await collection.findOneAndUpdate(
      {
        $and: [
          { $or: [{ id: id }, { _id: id as any }] },
          { status: 'live' },
          { endTime: { $gt: new Date() } },
          {
            $expr: {
              $gt: [amount, '$currentHighestBid'],
            },
          },
        ],
      },
      {
        $set: {
          currentHighestBid: amount,
        },
        $inc: {
          bidsCount: 1,
        },
        $push: {
          bids: newBid as any,
        },
      },
      { returnDocument: 'after' }
    );

    // 3. Handle unsuccessful update (bid rejected or auction unavailable)
    if (!updatedAuction) {
      // Check current auction state to return specific error reason
      const existingAuction = await collection.findOne({
        $or: [{ id: id }, { _id: id as any }],
      });

      if (!existingAuction) {
        return NextResponse.json(
          { success: false, error: 'Auction not found.' },
          { status: 404 }
        );
      }

      if (existingAuction.status !== 'live' || new Date(existingAuction.endTime) <= new Date()) {
        return NextResponse.json(
          { success: false, error: 'This auction has already ended.' },
          { status: 400 }
        );
      }

      if (amount <= existingAuction.currentHighestBid) {
        return NextResponse.json(
          {
            success: false,
            error: `Bid must be higher than the current highest bid ($${existingAuction.currentHighestBid}).`,
            currentHighestBid: existingAuction.currentHighestBid,
          },
          { status: 409 } // 409 Conflict
        );
      }

      return NextResponse.json(
        { success: false, error: 'Failed to place bid. Please try again.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Bid placed successfully!',
      data: {
        bid: newBid,
        auction: updatedAuction,
      },
    });
  } catch (error) {
    console.error('Error placing bid:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while processing bid.' },
      { status: 500 }
    );
  }
}