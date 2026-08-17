import Link from 'next/link';
import Image from 'next/image';
import { getAuctions, initializeStore, Auction } from '@/lib/store';

export const dynamic = 'force-dynamic';

function getBidCount(item: Auction): number {
  return Array.isArray(item.history) ? item.history.length : item.bidsCount || 0;
}

function getTimeLeft(endTimeStr: string): string {
  const diff = new Date(endTimeStr).getTime() - Date.now();
  if (diff <= 0) return 'Ended';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h left`;
  }
  return `${hours}h ${mins}m left`;
}

function AuctionCard({ item, badgeText, badgeBg }: { item: Auction; badgeText: string; badgeBg: string }) {
  const imageSrc =
    item.images && item.images.length > 0
      ? item.images[0]
      : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600';

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between">
      <div>
        <div className="relative aspect-square w-full bg-slate-100">
          <Image
            src={imageSrc}
            alt={item.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 25vw"
          />
          <div className={`absolute top-3 left-3 text-white font-bold text-[10px] px-2.5 py-1 rounded-full backdrop-blur-sm ${badgeBg}`}>
            {badgeText}
          </div>
        </div>

        <div className="p-4 space-y-2">
          <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">
            {item.category}
          </span>
          <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{item.title}</h3>
          <p className="text-xs text-slate-500 line-clamp-2">{item.description}</p>
        </div>
      </div>

      <div className="p-4 pt-0 border-t border-slate-100 mt-4 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-slate-400 block font-semibold">Highest Bid</span>
          <span className="text-lg font-black text-purple-950">${item.currentHighestBid.toFixed(2)}</span>
        </div>
        <Link
          href={`/auction/${encodeURIComponent(item.id)}`}
          className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition"
        >
          Place Bid
        </Link>
      </div>
    </div>
  );
}

export default async function HomePage() {
  await initializeStore();

  const allAuctions = getAuctions();
  const liveAuctions = allAuctions.filter((a) => a.status === 'live');

  const endingSoon = [...liveAuctions]
    .sort((a, b) => new Date(a.endTime).getTime() - new Date(b.endTime).getTime())
    .slice(0, 4);

  const hotAuctions = [...liveAuctions]
    .sort((a, b) => getBidCount(b) - getBidCount(a))
    .slice(0, 4);

  const categoryCounts = allAuctions.reduce<Record<string, number>>((acc, item) => {
    if (!item.category) return acc;
    const key = item.category.toLowerCase();
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const categoryConfig = [
    { name: 'Electronics', key: 'electronics', icon: '💻' },
    { name: 'Photography', key: 'photography', icon: '📷' },
    { name: 'General', key: 'general', icon: '📦' },
    { name: 'Collectibles', key: 'collectibles', icon: '🎨' },
  ];

  const categories = categoryConfig.map((cat) => ({
    ...cat,
    count: categoryCounts[cat.key] || 0,
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Banner */}
      <section className="bg-gradient-to-b from-purple-900 via-purple-950 to-slate-900 text-white py-16 px-4">
        <div className="max-w-5xl mx-auto text-center space-y-4">
          <span className="px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-400/30 rounded-full text-xs font-bold uppercase tracking-wider inline-block">
            Live eBay-Style Auctions
          </span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
            Bid in Real-Time. <br />
            <span className="text-purple-400">Win Rare Items Today.</span>
          </h1>
          <p className="text-slate-300 max-w-2xl mx-auto text-sm sm:text-base">
            Discover ending-soon auctions, place competitive bids with anti-sniping protection, and sell your own goods seamlessly.
          </p>

          <div className="pt-4 flex justify-center gap-4">
            <Link
              href="/auctions"
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-3 rounded-xl text-sm transition shadow-lg shadow-purple-600/30"
            >
              Explore All Auctions
            </Link>
            <Link
              href="/seller/create"
              className="bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3 rounded-xl text-sm transition border border-white/10"
            >
              Start Selling
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        {/* Categories Section */}
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-6">Browse by Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                href={`/auctions?category=${encodeURIComponent(cat.key)}`}
                className="bg-white border border-slate-200 hover:border-purple-300 p-5 rounded-2xl flex items-center gap-4 transition shadow-sm hover:shadow-md group"
              >
                <div className="text-3xl p-3 bg-purple-50 group-hover:bg-purple-100 rounded-xl transition">
                  {cat.icon}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">{cat.name}</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {cat.count} {cat.count === 1 ? 'Item' : 'Items'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Ending Soon Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                ⏳ Ending Soonest
              </h2>
              <p className="text-xs text-slate-500">Don&apos;t miss your chance to place the winning bid.</p>
            </div>
            <Link href="/auctions?status=live" className="text-xs font-bold text-purple-600 hover:underline">
              View All Live →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {endingSoon.map((item) => (
              <AuctionCard
                key={item.id}
                item={item}
                badgeText={`⏰ ${getTimeLeft(item.endTime)}`}
                badgeBg="bg-rose-500/90"
              />
            ))}
          </div>
        </section>

        {/* Hot Auctions Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                🔥 Hot Auctions
              </h2>
              <p className="text-xs text-slate-500">Most active bidding wars happening right now.</p>
            </div>
            <Link href="/auctions" className="text-xs font-bold text-purple-600 hover:underline">
              Explore Marketplace →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {hotAuctions.map((item) => {
              const bids = getBidCount(item);
              return (
                <AuctionCard
                  key={item.id}
                  item={item}
                  badgeText={`🔥 ${bids} ${bids === 1 ? 'Bid' : 'Bids'}`}
                  badgeBg="bg-purple-900/90"
                />
              );
            })}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        <p>© 2026 GeekyBid - Garvit Chawla.</p>
      </footer>
    </div>
  );
}