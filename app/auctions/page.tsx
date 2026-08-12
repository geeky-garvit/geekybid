import { Suspense } from 'react';
import Link from 'next/link';
import AuctionCard from '@/components/auction/AuctionCard';
import FilterBar from '@/components/auction/FilterBar';
import { Auction } from '@/lib/types/auction';

async function getAuctions(category?: string, query?: string): Promise<Auction[]> {
  try {
    let url = 'https://dummyjson.com/products?limit=20';
    if (category && category !== 'all') {
      url = `https://dummyjson.com/products/category/${encodeURIComponent(category)}`;
    }

    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return [];

    const data = await res.json();
    let items = data.products || [];

    if (query) {
      items = items.filter((item: any) =>
        item.title.toLowerCase().includes(query.toLowerCase())
      );
    }

    return items.map((item: any) => ({
      id: String(item.id),
      title: item.title,
      description: item.description,
      category: item.category,
      startingPrice: Math.round(item.price * 0.7),
      currentHighestBid: item.price,
      minIncrement: 5,
      bidsCount: Math.floor(Math.random() * 15) + 1,
      images: item.images?.length ? item.images : [`https://picsum.photos/seed/${item.id}/600/600`],
      endTime: new Date(Date.now() + 3600 * 1000 * ((item.id % 5) + 1)).toISOString(),
      status: 'live',
      seller: {
        id: `seller-${item.id}`,
        name: `Seller_${item.id}`,
        avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=Seller_${item.id}`,
        rating: 4.8,
      },
    }));
  } catch {
    return [];
  }
}

export default async function AuctionsListingPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { category, q } = await searchParams;
  const auctions = await getAuctions(category, q);

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-purple-100 pb-4">
        <div>
          <h1 className="text-3xl font-black text-purple-950 tracking-tight">Explore Auctions</h1>
          <p className="text-xs text-purple-900/60">Discover live bids on rare tech, collectibles, and hardware.</p>
        </div>
      </div>

      <Suspense fallback={<div className="h-16 bg-purple-50/50 rounded-2xl animate-pulse" />}>
        <FilterBar currentCategory={category || 'all'} searchQuery={q || ''} />
      </Suspense>

      {auctions.length === 0 ? (
        <div className="text-center py-12 bg-purple-50/50 rounded-2xl border border-purple-100">
          <p className="text-slate-600 font-bold text-sm">No auctions found matching your filter.</p>
          <Link href="/auctions" className="text-xs font-bold text-purple-600 underline mt-2 inline-block">
            Clear Filters
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {auctions.map((auction) => (
            <AuctionCard key={auction.id} auction={auction} />
          ))}
        </div>
      )}
    </main>
  );
}
