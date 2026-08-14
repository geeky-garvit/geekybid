// src/app/auctions/page.tsx
import Link from 'next/link';
import { getAuctions, initializeStore } from '@/lib/store';
import InfiniteAuctionGrid from '@/app/components/auction/InfiniteAuctionGrid';

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
  // Ensure store is populated before reading
  await initializeStore();

  const queryParams = await searchParams;

  const category = queryParams.category || 'all';
  const status = queryParams.status || 'live';
  const minPrice = queryParams.minPrice ? parseFloat(queryParams.minPrice) : undefined;
  const maxPrice = queryParams.maxPrice ? parseFloat(queryParams.maxPrice) : undefined;
  const endingWithin = queryParams.endingWithin ? parseInt(queryParams.endingWithin) : undefined;
  const sortBy = queryParams.sortBy || 'endingSoon';
  const search = queryParams.search || '';

  let items = getAuctions({
    category: category !== 'all' ? category : undefined,
    status: status !== 'all' ? status : undefined,
    search: search || undefined,
  });

  if (minPrice !== undefined) items = items.filter((a) => a.currentHighestBid >= minPrice);
  if (maxPrice !== undefined) items = items.filter((a) => a.currentHighestBid <= maxPrice);
  if (endingWithin !== undefined) {
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
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        <aside className="bg-white border border-slate-200 p-6 rounded-2xl h-fit space-y-6">
          <div className="flex justify-between items-center pb-4 border-b">
            <h2 className="font-black text-slate-900 text-sm">Filters</h2>
            <Link href="/auctions" className="text-[10px] font-bold text-purple-600 hover:underline">
              Reset All
            </Link>
          </div>

          <form method="GET" className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Search Keywords</label>
              <input
                type="text"
                name="search"
                defaultValue={search}
                placeholder="e.g. Keyboard"
                className="w-full p-2.5 border rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
              <select
                name="category"
                defaultValue={category}
                className="w-full p-2.5 border rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-600 outline-none"
              >
                <option value="all">All Categories</option>
                <option value="electronics">Electronics</option>
                <option value="photography">Photography</option>
                <option value="general">General</option>
                <option value="collectibles">Collectibles</option>
                <option value="art">Art</option>
                <option value="fashion">Fashion</option>
                <option value="jewelry">Jewelry</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Listing Status</label>
              <select
                name="status"
                defaultValue={status}
                className="w-full p-2.5 border rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-600 outline-none"
              >
                <option value="live">Live Auctions Only</option>
                <option value="ended">Ended Auctions</option>
                <option value="all">All Listings</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ending Within</label>
              <select
                name="endingWithin"
                defaultValue={endingWithin?.toString() || ''}
                className="w-full p-2.5 border rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-600 outline-none"
              >
                <option value="">Anytime</option>
                <option value="1">Within 1 Hour</option>
                <option value="6">Within 6 Hours</option>
                <option value="24">Within 24 Hours</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Sort By</label>
              <select
                name="sortBy"
                defaultValue={sortBy}
                className="w-full p-2.5 border rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-600 outline-none"
              >
                <option value="endingSoon">Ending Soonest</option>
                <option value="mostBids">Most Bids (Hot)</option>
                <option value="priceAsc">Price: Low to High</option>
                <option value="priceDesc">Price: High to Low</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-md shadow-purple-600/20"
            >
              Apply Filters
            </button>
          </form>
        </aside>

        <section className="md:col-span-3 space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-black text-slate-900">
              Auction Marketplace <span className="text-xs font-normal text-slate-500">({items.length} items)</span>
            </h1>
          </div>

          <InfiniteAuctionGrid
            key={`grid-${items.length}-${category}-${status}-${search}`}
            initialItems={initialSlice}
            initialNextCursor={initialNextCursor}
          />
        </section>
      </main>
    </div>
  );
}