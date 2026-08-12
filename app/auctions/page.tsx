import { Suspense } from 'react';
import Link from 'next/link';
import AuctionCard from '@/components/auction/AuctionCard';
import FilterBar from '@/components/auction/FilterBar';
import { getAllAuctions } from '@/lib/data';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{ category?: string; q?: string }>;
}

export default async function AuctionsListingPage({ searchParams }: PageProps) {
  const { category, q } = await searchParams;

  // 1. Fetch all items from in-memory store
  let auctions = await getAllAuctions();

  // 2. Apply category and search query filters locally
  if (category && category !== 'all') {
    auctions = auctions.filter(
      (a) => a.category.toLowerCase() === category.toLowerCase()
    );
  }

  if (q) {
    const query = q.toLowerCase();
    auctions = auctions.filter(
      (a) =>
        a.title.toLowerCase().includes(query) ||
        a.description.toLowerCase().includes(query)
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-purple-100 pb-4">
        <div>
          <h1 className="text-3xl font-black text-purple-950 tracking-tight">
            Explore Auctions
          </h1>
          <p className="text-xs text-purple-900/60">
            Discover live bids from our {auctions.length > 0 ? '500+' : ''} listings.
          </p>
        </div>
      </div>

      <Suspense fallback={<div className="h-16 bg-purple-50/50 rounded-2xl animate-pulse" />}>
        <FilterBar currentCategory={category || 'all'} searchQuery={q || ''} />
      </Suspense>

      {auctions.length === 0 ? (
        <div className="text-center py-12 bg-purple-50/50 rounded-2xl border border-purple-100">
          <p className="text-slate-600 font-bold text-sm">
            No auctions found matching your filter.
          </p>
          <Link
            href="/auctions"
            className="text-xs font-bold text-purple-600 underline mt-2 inline-block"
          >
            Clear Filters
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {auctions.map((auction) => (
            <AuctionCard key={auction.id} auction={auction} />
          ))}
        </div>
      )}
    </main>
  );
}