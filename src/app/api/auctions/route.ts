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
          seller: { select: { id: true, name: true, avatar: true } },
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
    const {
      title,
      category,
      description,
      startingPrice,
      startingBid,
      minIncrement,
      endTime,
      images,
      sellerId,
    } = body;

    const price = parseFloat(startingPrice || startingBid);

    if (!title || isNaN(price) || !endTime || !sellerId) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid required fields' },
        { status: 400 }
      );
    }

    // Ensure the seller exists in PostgreSQL first
    const sellerExists = await prisma.user.findUnique({
      where: { id: sellerId },
    });

    // Fallback seller creation if sellerId is not yet registered in DB
    if (!sellerExists) {
      await prisma.user.create({
        data: {
          id: sellerId,
          name: 'Seller',
          email: `${sellerId}@example.com`,
          password: '$2a$10$abcdefghijklmnopqrstuu', // Default hashed password
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
        },
      });
    }

    const auction = await prisma.auction.create({
      data: {
        title,
        category: category || 'general',
        description: description || '',
        startingBid: price,
        currentPrice: price,
        minIncrement: parseFloat(minIncrement) || 5,
        endTime: new Date(endTime),
        images: images || [],
        status: 'ACTIVE',
        sellerId,
      },
    });

    return NextResponse.json({ success: true, auction }, { status: 201 });
  } catch (error) {
    console.error('Failed to create auction in DB:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create auction in database' },
      { status: 500 }
    );
  }
}