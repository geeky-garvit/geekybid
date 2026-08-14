import AuctionCard from '@/components/auction/AuctionCard';
import { Auction } from '@/lib/types/auction';

async function getHomeAuctions(): Promise<{ endingSoon: Auction[]; hotAuctions: Auction[] }> {
  try {
    const res = await fetch('https://dummyjson.com/products?limit=12', { next: { revalidate: 60 } });
    const data = await res.json();

    const auctions: Auction[] = data.products.map((item: any) => ({
      id: String(item.id),
      title: item.title,
      description: item.description,
      category: item.category,
      startingPrice: Math.round(item.price * 0.7),
      currentHighestBid: item.price,
      minIncrement: 5,
      bidsCount: Math.floor(Math.random() * 25) + 3,
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

    return {
      endingSoon: auctions.slice(0, 6),
      hotAuctions: auctions.slice(6, 12),
    };
  } catch (error) {
    console.error('Failed to fetch products from DummyJSON', error);
    return { endingSoon: [], hotAuctions: [] };
  }
}

export default async function HomePage() {
  const { endingSoon, hotAuctions } = await getHomeAuctions();

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 space-y-12">
      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-3xl p-8 text-white space-y-4 shadow-xl">
        <span className="text-xs font-bold uppercase tracking-wider text-purple-300 bg-purple-800/50 px-3 py-1 rounded-full border border-purple-500/30">
          Live Bidding Platform
        </span>
        <h1 className="text-4xl font-black tracking-tight">
          Bid on Rare Gear, Tech & Collectibles
        </h1>
        <p className="text-purple-200 text-sm max-w-xl">
          Real-time competition with automated auction closing, anti-sniping protection, and instant bidding.
        </p>
      </section>

      {/* Hot Auctions Section */}
      <section className="space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-black text-purple-950 tracking-tight">🔥 Hot Auctions</h2>
            <p className="text-xs text-purple-900/60">Auctions with the highest bid competition right now.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hotAuctions.map((auction) => (
            <AuctionCard key={auction.id} auction={auction} />
          ))}
        </div>
      </section>

      {/* Ending Soon Section */}
      <section className="space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-black text-purple-950 tracking-tight">⏰ Ending Soon</h2>
            <p className="text-xs text-purple-900/60">Place your bids before the countdown runs out.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {endingSoon.map((auction) => (
            <AuctionCard key={auction.id} auction={auction} />
          ))}
        </div>
      </section>
    </main>
  );
}
