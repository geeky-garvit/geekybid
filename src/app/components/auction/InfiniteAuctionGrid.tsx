// src/components/auction/InfiniteAuctionGrid.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Auction } from '@/lib/store';
import { useSearchParams } from 'next/navigation';

interface Props {
  initialItems: Auction[];
  initialNextCursor: string | null;
}

export default function InfiniteAuctionGrid({ initialItems, initialNextCursor }: Props) {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<Auction[]>(initialItems);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [loading, setLoading] = useState(false);

  // Synchronize state when initialItems or search params update
  useEffect(() => {
    setItems(initialItems);
    setNextCursor(initialNextCursor);
  }, [initialItems, initialNextCursor, searchParams]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loading) return;

    setLoading(true);
    const params = new URLSearchParams(searchParams.toString());
    params.set('cursor', nextCursor);
    params.set('limit', '8');

    try {
      const res = await fetch(`/api/auctions?${params.toString()}`);
      const data = await res.json();

      setItems((prev) => [...prev, ...(data.items || [])]);
      setNextCursor(data.nextCursor || null);
    } catch (err) {
      console.error('Failed to load more auctions:', err);
    } finally {
      setLoading(false);
    }
  }, [nextCursor, loading, searchParams]);

  const observerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const target = observerRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && nextCursor) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [loadMore, nextCursor]);

  const getTimeLeft = (endTimeStr: string) => {
    const diff = new Date(endTimeStr).getTime() - new Date().getTime();
    if (diff <= 0) return 'Ended';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) return `${Math.floor(hours / 24)}d left`;
    return `${hours}h ${mins}m left`;
  };

  if (items.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3 shadow-sm">
        <span className="text-4xl block">🔍</span>
        <h3 className="text-lg font-bold text-slate-800">No auctions match your filters</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Try adjusting or resetting your selected search criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => {
          const mainImage =
            item.images && item.images.length > 0
              ? item.images[0]
              : 'https://picsum.photos/seed/fallback/600/600';

          return (
            <div
              key={item.id}
              className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-square w-full bg-slate-100">
                  <Image
                    src={mainImage}
                    alt={item.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div
                    className={`absolute top-3 left-3 text-white font-bold text-[10px] px-2.5 py-1 rounded-full backdrop-blur-sm shadow-sm ${
                      item.status === 'live' ? 'bg-emerald-600/90' : 'bg-slate-700/90'
                    }`}
                  >
                    {item.status === 'live' ? `⏰ ${getTimeLeft(item.endTime)}` : 'ENDED'}
                  </div>
                  <div className="absolute top-3 right-3 bg-purple-900/90 text-white font-bold text-[10px] px-2.5 py-1 rounded-full backdrop-blur-sm shadow-sm">
                    {item.bidsCount} Bids
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

              <div className="p-4 pt-3 border-t border-slate-100 mt-2 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">
                    Current High Bid
                  </span>
                  <span className="text-lg font-black text-purple-950">
                    ${item.currentHighestBid.toFixed(2)}
                  </span>
                </div>
                <Link
                  href={`/auction/${item.id}`}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition shadow-sm shadow-purple-600/20"
                >
                  View Listing
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Infinite Scroll Trigger & Loader */}
      <div ref={observerRef} className="py-6 text-center">
        {loading && (
          <p className="text-xs font-bold text-purple-600 animate-pulse">
            Loading more auctions...
          </p>
        )}
        {!nextCursor && items.length > 0 && (
          <p className="text-xs text-slate-400 font-semibold">
            You have reached the end of the marketplace.
          </p>
        )}
      </div>
    </div>
  );
}