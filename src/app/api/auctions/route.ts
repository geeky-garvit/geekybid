import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { Filter, Sort } from 'mongodb';
import { Auction } from '@/types/auction'; 

const DB_NAME = process.env.MONGODB_DB || 'auctions_db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const status = searchParams.get('status') || 'live';
    const sortBy = searchParams.get('sortBy') || 'endingSoon';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    // Explicitly pass <Auction> generic to collection call
    const collection = db.collection<Auction>('auctions');
    const query: Filter<Auction> = {};

    if (status !== 'all') {
      query.status = status as Auction['status'];
    }

    if (category && category !== 'all') {
      query.category = category as Auction['category'];
    }

    if (search) {
      query.$text = { $search: search };
    }

    let sortOption: Sort = {};
    switch (sortBy) {
      case 'endingSoon':
        sortOption = { endTime: 1 };
        break;
      case 'priceLow':
        sortOption = { currentHighestBid: 1 };
        break;
      case 'priceHigh':
        sortOption = { currentHighestBid: -1 };
        break;
      case 'mostBids':
        sortOption = { bidsCount: -1 };
        break;
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      default:
        sortOption = { endTime: 1 };
    }

    const skip = (page - 1) * limit;

    const [auctions, total] = await Promise.all([
      collection
        .find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .toArray(),
      collection.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: auctions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch auctions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch auctions' },
      { status: 500 }
    );
  }
}