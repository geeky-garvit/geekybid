import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search')?.trim() || '';
    const category = searchParams.get('category');
    const status = searchParams.get('status') || 'ACTIVE';
    const sortBy = searchParams.get('sortBy') || 'endingSoon';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '10', 10));

    const where: any = {};

    if (status !== 'all') {
      where.status = status;
    }

    if (category && category !== 'all') {
      where.category = { equals: category, mode: 'insensitive' };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    let orderBy: any = {};
    switch (sortBy) {
      case 'endingSoon':
        orderBy = { endTime: 'asc' };
        break;
      case 'priceLow':
        orderBy = { currentPrice: 'asc' };
        break;
      case 'priceHigh':
        orderBy = { currentPrice: 'desc' };
        break;
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      default:
        orderBy = { endTime: 'asc' };
    }

    const skip = (page - 1) * limit;

    const [auctions, total] = await Promise.all([
      prisma.auction.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          seller: { select: { name: true, avatar: true } },
          _count: { select: { bids: true } },
        },
      }),
      prisma.auction.count({ where }),
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, category, description, startingBid, minIncrement, endTime, images, sellerId } = body;

    if (!title || !startingBid || !endTime || !sellerId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const newAuction = await prisma.auction.create({
      data: {
        title,
        category: category || 'general',
        description: description || '',
        startingBid: parseFloat(startingBid),
        currentPrice: parseFloat(startingBid),
        minIncrement: parseFloat(minIncrement) || 1,
        endTime: new Date(endTime),
        images: images || [],
        status: 'ACTIVE',
        sellerId,
      },
    });

    return NextResponse.json({ success: true, auction: newAuction });
  } catch (error) {
    console.error('Failed to create auction:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create auction record' },
      { status: 500 }
    );
  }
}