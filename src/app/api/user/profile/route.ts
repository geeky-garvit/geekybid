import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import clientPromise from '@/lib/mongodb';
import { findUserByEmail, getUserActivityHistory } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as any;
    const userDoc = await findUserByEmail(decoded.email);

    if (!userDoc) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || 'auctions_db');

    // Fetch User's Created Auctions & Bids
    const myAuctions = await db.collection('auctions').find({ sellerId: userDoc.id }).toArray();
    const myBids = await db.collection('bids').find({ userId: userDoc.id }).toArray();

    // Fetch Activity Timeline
    const activities = await getUserActivityHistory(userDoc.id);

    return NextResponse.json({
      success: true,
      profile: {
        id: userDoc.id,
        name: userDoc.name,
        email: userDoc.email,
        avatar: userDoc.avatar,
        role: userDoc.role,
        createdAt: userDoc.createdAt,
      },
      stats: {
        totalAuctionsCreated: myAuctions.length,
        totalBidsPlaced: myBids.length,
      },
      activities,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Invalid session' }, { status: 401 });
  }
}