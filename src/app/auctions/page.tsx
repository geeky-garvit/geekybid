import React from 'react';
import { prisma } from '@/lib/db';
import InfiniteAuctionGrid from '@/app/components/auction/InfiniteAuctionGrid';
import AuctionHorizontalFilter from './components/AuctionSidebarFilter';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface SearchParams {
  category?: string;
  status?: string;
  minPrice?: string;
  maxPrice?: string;
  endingWithin?: string;
  sortBy?: string;
  search?: string;
}

export default async function AuctionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const queryParams = await searchParams;

  const category = queryParams.category || 'all';
  const status = queryParams.status || 'live';
  const minPrice = queryParams.minPrice ? parseFloat(queryParams.minPrice) : undefined;
  const maxPrice = queryParams.maxPrice ? parseFloat(queryParams.maxPrice) : undefined;
  const endingWithin = queryParams.endingWithin ? parseInt(queryParams.endingWithin, 10) : undefined;
  const sortBy = queryParams.sortBy || 'endingSoon';
  const search = queryParams.search || '';

  const whereFilter: any = {};

  if (category !== 'all') {
    whereFilter.category = { equals: category, mode: 'insensitive' };
  }

  if (status === 'live' || status === 'ACTIVE') {
    whereFilter.status = 'ACTIVE';
  } else if (status !== 'all') {
    whereFilter.status = status.toUpperCase();
  }

  if (search.trim()) {
    whereFilter.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    whereFilter.currentPrice = {};
    if (minPrice !== undefined && !isNaN(minPrice)) {
      whereFilter.currentPrice.gte = minPrice;
    }
    if (maxPrice !== undefined && !isNaN(maxPrice)) {
      whereFilter.currentPrice.lte = maxPrice;
    }
  }

  if (endingWithin !== undefined && !isNaN(endingWithin)) {
    const cutoffDate = new Date(Date.now() + endingWithin * 3600 * 1000);
    whereFilter.endTime = { lte: cutoffDate };
  }

  let orderBy: any = { endTime: 'asc' };
  if (sortBy === 'priceAsc') orderBy = { currentPrice: 'asc' };
  if (sortBy === 'priceDesc') orderBy = { currentPrice: 'desc' };
  if (sortBy === 'newest') orderBy = { createdAt: 'desc' };

  const dbAuctions = await prisma.auction.findMany({
    where: whereFilter,
    orderBy,
    include: {
      seller: { select: { id: true, name: true, avatar: true } },
      bids: {
        orderBy: { timestamp: 'desc' },
        include: { user: { select: { name: true, avatar: true } } },
      },
      _count: { select: { bids: true } },
    },
  });

  const items = dbAuctions.map((a) => {
    let mappedStatus: 'live' | 'ended' | 'paid' = 'live';
    const normalized = a.status.toLowerCase();

    if (normalized === 'ended' || normalized === 'closed') {
      mappedStatus = 'ended';
    } else if (normalized === 'paid' || normalized === 'completed') {
      mappedStatus = 'paid';
    } else if (new Date(a.endTime) <= new Date()) {
      mappedStatus = 'ended';
    }

    return {
      id: a.id,
      title: a.title,
      description: a.description,
      category: a.category,
      startingBid: a.startingBid,
      startingPrice: a.startingBid,
      currentHighestBid: a.currentPrice,
      minIncrement: a.minIncrement,
      status: mappedStatus,
      images: a.images,
      endTime: a.endTime.toISOString(),
      sellerId: a.sellerId,
      sellerName: a.seller?.name || 'Seller',
      sellerAvatar: a.seller?.avatar || '',
      bidsCount: a._count.bids,
      history: a.bids.map((b) => {
        const isoTimeString = b.timestamp.toISOString();
        return {
          id: b.id,
          amount: b.amount,
          bidderId: b.userId,
          time: isoTimeString,
          timestamp: isoTimeString,
          bidderName: b.user?.name || 'Anonymous',
          bidderAvatar: b.user?.avatar || '',
        };
      }),
    };
  });

  const limit = 8;
  const initialSlice = items.slice(0, limit);
  const initialNextCursor =
    initialSlice.length === limit && items.length > limit
      ? initialSlice[initialSlice.length - 1].id
      : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <AuctionHorizontalFilter
          search={search}
          category={category}
          status={status}
          minPrice={minPrice}
          maxPrice={maxPrice}
          endingWithin={endingWithin}
          sortBy={sortBy}
        />

        <section className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-black text-slate-900">
              Auction Marketplace{' '}
              <span className="text-xs font-normal text-slate-500">({items.length} items)</span>
            </h1>
          </div>

          <InfiniteAuctionGrid
            key={`grid-${items.length}-${category}-${status}-${search}-${sortBy}-${minPrice}-${maxPrice}`}
            initialItems={initialSlice}
            initialNextCursor={initialNextCursor}
          />
        </section>
      </main>
    </div>
  );
}