'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

interface WatchlistButtonProps {
  auctionId: string;
  initialIsWatchlisted?: boolean;
}

export default function WatchlistButton({
  auctionId,
  initialIsWatchlisted = false,
}: WatchlistButtonProps) {
  const { user, watchlist, setWatchlist } = useAuth() as any;
  
  // Sync initial state directly or fall back to checking global context
  const isCurrentlyInWatchlist =
    watchlist?.some((item: any) => item.id === auctionId || item === auctionId) ??
    initialIsWatchlisted;

  const [isWatchlisted, setIsWatchlisted] = useState(isCurrentlyInWatchlist);
  const [loading, setLoading] = useState(false);

  // Keep local state in sync when parent props or global context changes
  useEffect(() => {
    setIsWatchlisted(isCurrentlyInWatchlist);
  }, [isCurrentlyInWatchlist]);

  const toggleWatchlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      alert('Please log in to save items to your watchlist.');
      return;
    }

    const nextState = !isWatchlisted;
    
    // 1. Optimistic Local UI Update
    setIsWatchlisted(nextState);
    setLoading(true);

    // 2. Optimistic Context Watchlist Update (Refreshes Navbar badge immediately)
    if (setWatchlist && watchlist) {
      if (nextState) {
        setWatchlist([...watchlist, { id: auctionId }]);
      } else {
        setWatchlist(
          watchlist.filter(
            (item: any) => item.id !== auctionId && item !== auctionId
          )
        );
      }
    }

    try {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auctionId,
          userId: user.id,
        }),
      });

      const data = await res.json();
      
      if (!res.ok || !data.success) {
        // Revert on API failure
        setIsWatchlisted(!nextState);
      }
    } catch (err) {
      console.error('Watchlist toggle error:', err);
      // Revert on network failure
      setIsWatchlisted(!nextState);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggleWatchlist}
      disabled={loading}
      title={isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
      className="absolute top-3 right-3 bg-white/90 p-2 rounded-full shadow-md hover:bg-white transition text-xs hover:scale-110 active:scale-95 z-10 cursor-pointer disabled:opacity-50"
    >
      {isWatchlisted ? '❤️' : '🤍'}
    </button>
  );
}