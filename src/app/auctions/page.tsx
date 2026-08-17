import React from 'react';
import { getAuctions, initializeStore } from '@/lib/store';
import InfiniteAuctionGrid from '@/app/components/auction/InfiniteAuctionGrid';
import AuctionSidebarFilter from './components/AuctionSidebarFilter';

export const dynamic = 'force-dynamic';

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
  await initializeStore();

  const queryParams = await searchParams;

  const category = queryParams.category || 'all';
  const status = queryParams.status || 'live';
  const minPrice = queryParams.minPrice ? parseFloat(queryParams.minPrice) : undefined;
  const maxPrice = queryParams.maxPrice ? parseFloat(queryParams.maxPrice) : undefined;
  const endingWithin = queryParams.endingWithin ? parseInt(queryParams.endingWithin, 10) : undefined;
  const sortBy = queryParams.sortBy || 'endingSoon';
  const search = queryParams.search || '';

  let items = getAuctions({
    category: category !== 'all' ? category : undefined,
    status: status !== 'all' ? status : undefined,
    search: search || undefined,
  });

  if (minPrice !== undefined && !isNaN(minPrice)) {
    items = items.filter((a) => a.currentHighestBid >= minPrice);
  }
  if (maxPrice !== undefined && !isNaN(maxPrice)) {
    items = items.filter((a) => a.currentHighestBid <= maxPrice);
  }
  if (endingWithin !== undefined && !isNaN(endingWithin)) {
    const cutoffTime = new Date(Date.now() + endingWithin * 3600 * 1000).getTime();
    items = items.filter((a) => new Date(a.endTime).getTime() <= cutoffTime);
  }

  items.sort((a, b) => {
    if (sortBy === 'endingSoon') return new Date(a.endTime).getTime() - new Date(b.endTime).getTime();
    if (sortBy === 'priceAsc') return a.currentHighestBid - b.currentHighestBid;
    if (sortBy === 'priceDesc') return b.currentHighestBid - a.currentHighestBid;
    if (sortBy === 'mostBids') return b.bidsCount - a.bidsCount;
    return 0;
  });

  const limit = 8;
  const initialSlice = items.slice(0, limit);
  const initialNextCursor =
    initialSlice.length === limit && items.length > limit
      ? initialSlice[initialSlice.length - 1].id
      : null;

  return (
    <div className="min-h-screen bg-slate-50 h-">
      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-4 gap-8 h-[50vh]">
        <AuctionSidebarFilter 
          search={search}
          category={category}
          status={status}
          minPrice={minPrice}
          maxPrice={maxPrice}
          endingWithin={endingWithin}
          sortBy={sortBy}
          
        />

        <section className="md:col-span-3 space-y-6">
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