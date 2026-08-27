'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

interface WatchlistButtonProps {
  auctionId: string;
  initialIsWatchlisted?: boolean;
}

export default function WatchlistButton({ auctionId, initialIsWatchlisted = false }: WatchlistButtonProps) {
  const { user } = useAuth();
  const [isWatchlisted, setIsWatchlisted] = useState(initialIsWatchlisted);
  const [loading, setLoading] = useState(false);

  const toggleWatchlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      alert('Please log in to save items to your watchlist.');
      return;
    }

    // Optimistic UI update
    setIsWatchlisted((prev) => !prev);
    setLoading(true);

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
      if (!data.success) {
        // Revert on failure
        setIsWatchlisted((prev) => !prev);
      }
    } catch (err) {
      console.error('Watchlist toggle error:', err);
      setIsWatchlisted((prev) => !prev);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggleWatchlist}
      disabled={loading}
      title={isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
      className="absolute top-3 right-3 bg-white/90 p-2 rounded-full shadow-md hover:bg-white transition text-xs hover:scale-110 active:scale-95 z-10"
    >
      {isWatchlisted ? '❤️' : '🤍'}
    </button>
  );
}