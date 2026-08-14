// src/app/watchlist/page.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { getAuctions } from '@/lib/store';

export default function WatchlistPage() {
  const { watchlist, toggleWatchlist } = useAuth();
  const allAuctions = getAuctions();

  const savedAuctions = allAuctions.filter((item) => watchlist.includes(item.id));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-xl font-black text-slate-900">My Watchlist</h1>
          <p className="text-xs text-slate-500">Track current high bids on items you're monitoring.</p>
        </div>
        <span className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1.5 rounded-full border border-purple-100">
          {savedAuctions.length} Saved Items
        </span>
      </div>

      {savedAuctions.length === 0 ? (
        <div className="bg-white border rounded-2xl p-12 text-center space-y-3">
          <span className="text-4xl">❤️</span>
          <h3 className="text-lg font-bold text-slate-800">Your watchlist is empty</h3>
          <p className="text-xs text-slate-500">Browse the marketplace and click the heart icon on items to keep track of them here.</p>
          <Link
            href="/auctions"
            className="inline-block bg-purple-600 text-white font-bold text-xs px-4 py-2 rounded-xl"
          >
            Explore Marketplace
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedAuctions.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-square w-full bg-slate-100">
                  <Image src={item.images[0]} alt={item.title} fill className="object-cover" sizes="33vw" />
                  <button
                    onClick={() => toggleWatchlist(item.id)}
                    className="absolute top-3 right-3 bg-white/90 p-2 rounded-full shadow hover:bg-white transition"
                  >
                    ❤️
                  </button>
                </div>

                <div className="p-4 space-y-2">
                  <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">
                    {item.category}
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{item.title}</h3>
                </div>
              </div>

              <div className="p-4 pt-0 border-t border-slate-100 mt-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Current High Bid</span>
                  <span className="text-lg font-black text-purple-950">${item.currentHighestBid.toFixed(2)}</span>
                </div>
                <Link
                  href={`/auction/${item.id}`}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition"
                >
                  View Item
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}