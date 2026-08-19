import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { Filter, Sort } from 'mongodb';
import { Auction } from '@/types/auction';
import { getAuctionsQuerySchema } from '@/lib/validation';

const DB_NAME = process.env.MONGODB_DB || 'auctions_db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 1. Extract raw params
    const rawParams = {
      search: searchParams.get('search'),
      category: searchParams.get('category'),
      status: searchParams.get('status'),
      sortBy: searchParams.get('sortBy'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    };

    // Filter out null/undefined keys before validation
    const cleanParams = Object.fromEntries(
      Object.entries(rawParams).filter(([_, v]) => v !== null && v !== undefined)
    );

    // 2. Validate with Zod
    const validationResult = getAuctionsQuerySchema.safeParse(cleanParams);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { search, category, status, sortBy, page, limit } = validationResult.data;

    // 3. Connect to MongoDB
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection<Auction>('auctions');
    const query: Filter<Auction> = {};

    if (status !== 'all') {
      query.status = status as Auction['status'];
    }

    if (category && category !== 'all') {
      query.category = category as Auction['category'];
    }

    if (search && search.trim() !== '') {
      query.$text = { $search: search.trim() };
    }

    // 4. Construct Sort Options
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

    // 5. Execute DB Query
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
  } catch (error: any) {
    console.error('Failed to fetch auctions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch auctions' },
      { status: 500 }
    );
  }
}