// src/app/watchlist/page.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { getAuctions, Auction, initializeStore, subscribeToStore } from '@/lib/store';
import { useState, useEffect } from 'react';

export default function WatchlistPage() {
  const { watchlist, toggleWatchlist } = useAuth();
  const [savedAuctions, setSavedAuctions] = useState<Auction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const refresh = () => {
      const allAuctions = getAuctions();
      setSavedAuctions(allAuctions.filter((item) => watchlist.includes(item.id)));
      setIsLoading(false);
    };
    initializeStore().then(refresh);
    return subscribeToStore(refresh);
  }, [watchlist]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="h-8 w-48 bg-slate-200 animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-72 bg-slate-100 animate-pulse rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-black text-slate-900">My Watchlist</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track current high bids on items you're monitoring.
          </p>
        </div>
        <span className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1.5 rounded-full border border-purple-100">
          {savedAuctions.length} Saved Items
        </span>
      </div>

      {/* Empty State vs. Watchlist Grid */}
      {savedAuctions.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3 shadow-sm">
          <span className="text-4xl block">❤️</span>
          <h3 className="text-lg font-bold text-slate-800">Your watchlist is empty</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Browse the marketplace and click the heart icon on items to keep track of them here.
          </p>
          <div className="pt-2">
            <Link
              href="/auctions"
              className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-md shadow-purple-600/20"
            >
              Explore Marketplace
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedAuctions.map((item) => {
            const displayPrice =
              typeof item.currentHighestBid === 'number'
                ? item.currentHighestBid
                : item.startingPrice || 0;

            const coverImage =
              item.images && item.images.length > 0
                ? item.images[0]
                : `https://picsum.photos/seed/${item.id}/600/600`;

            return (
              <div
                key={item.id}
                className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  {/* Image & Favorite Toggle */}
                  <div className="relative aspect-square w-full bg-slate-100">
                    <Image
                      src={coverImage}
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    <button
                      onClick={() => toggleWatchlist(item.id)}
                      title="Remove from Watchlist"
                      className="absolute top-3 right-3 bg-white/90 p-2 rounded-full shadow-sm hover:bg-white transition text-xs hover:scale-105 active:scale-95"
                    >
                      ❤️
                    </button>
                  </div>

                  {/* Details */}
                  <div className="p-4 space-y-1">
                    <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">
                      {item.category || 'Auction'}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{item.title}</h3>
                  </div>
                </div>

                {/* Price & Action Footer */}
                <div className="p-4 pt-3 border-t border-slate-100 mt-2 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">
                      Current High Bid
                    </span>
                    <span className="text-lg font-black text-purple-950">
                      ${displayPrice.toFixed(2)}
                    </span>
                  </div>
                  <Link
                    href={`/auction/${item.id}`}
                    className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition shadow-sm shadow-purple-600/20"
                  >
                    View Item
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
