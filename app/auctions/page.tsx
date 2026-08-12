import AuctionCard from '@/components/auction/AuctionCard';
import { Auction } from '@/lib/types/auction';
import Link from 'next/link';

async function getFilteredAuctions(category?: string, maxPrice?: string, sort?: string): Promise<Auction[]> {
  try {
    const res = await fetch('https://dummyjson.com/products?limit=30', { next: { revalidate: 60 } });
    const data = await res.json();

    let auctions: Auction[] = data.products.map((item: any) => ({
      id: String(item.id),
      title: item.title,
      description: item.description,
      category: item.category,
      startingPrice: Math.round(item.price * 0.7),
      currentHighestBid: item.price,
      minIncrement: 5,
      bidsCount: Math.floor(Math.random() * 30) + 1,
      images: item.images && item.images.length > 0 ? item.images : [`https://picsum.photos/seed/${item.id}/600/600`],
      endTime: new Date(Date.now() + (item.id % 5 + 1) * 3600 * 1000).toISOString(),
      status: 'live',
      seller: {
        id: `seller-${item.id}`,
        name: `Seller_${item.id}`,
        avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=Seller_${item.id}`,
        rating: 4.8,
      },
      history: [],
    }));

    if (category && category !== 'all') {
      auctions = auctions.filter((a) => a.category.toLowerCase() === category.toLowerCase());
    }

    if (maxPrice) {
      auctions = auctions.filter((a) => a.currentHighestBid <= Number(maxPrice));
    }

    if (sort === 'price-asc') auctions.sort((a, b) => a.currentHighestBid - b.currentHighestBid);
    if (sort === 'price-desc') auctions.sort((a, b) => b.currentHighestBid - a.currentHighestBid);
    if (sort === 'bids') auctions.sort((a, b) => b.bidsCount - a.bidsCount);

    return auctions;
  } catch (error) {
    console.error(error);
    return [];
  }
}

export default async function AuctionsListingPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; maxPrice?: string; sort?: string }>;
}) {
  const { category, maxPrice, sort } = await searchParams;
  const auctions = await getFilteredAuctions(category, maxPrice, sort);

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-black text-purple-950 tracking-tight">Marketplace Auctions</h1>
        <p className="text-purple-900/60 text-sm">Filter through active listings or click an item for quick view.</p>
      </header>

      {/* URL-driven Filters Bar */}
      <div className="flex flex-wrap gap-3 p-4 bg-white border border-purple-100 rounded-2xl shadow-sm text-xs font-semibold">
        <span className="text-slate-400 self-center">Categories:</span>
        <Link href="/auctions?category=all" className={`px-3 py-1.5 rounded-lg border ${!category || category === 'all' ? 'bg-purple-600 text-white border-purple-600' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>All</Link>
        <Link href="/auctions?category=beauty" className={`px-3 py-1.5 rounded-lg border ${category === 'beauty' ? 'bg-purple-600 text-white border-purple-600' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>Beauty</Link>
        <Link href="/auctions?category=fragrances" className={`px-3 py-1.5 rounded-lg border ${category === 'fragrances' ? 'bg-purple-600 text-white border-purple-600' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>Fragrances</Link>
        <Link href="/auctions?category=furniture" className={`px-3 py-1.5 rounded-lg border ${category === 'furniture' ? 'bg-purple-600 text-white border-purple-600' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>Furniture</Link>
        <Link href="/auctions?category=groceries" className={`px-3 py-1.5 rounded-lg border ${category === 'groceries' ? 'bg-purple-600 text-white border-purple-600' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>Groceries</Link>

        <span className="text-slate-400 self-center ml-auto">Sort:</span>
        <Link href={`/auctions?sort=bids${category ? `&category=${category}` : ''}`} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700">Most Active</Link>
        <Link href={`/auctions?sort=price-asc${category ? `&category=${category}` : ''}`} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700">Price: Low to High</Link>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {auctions.map((auction) => (
          <AuctionCard key={auction.id} auction={auction} />
        ))}
      </div>
    </main>
  );
}
