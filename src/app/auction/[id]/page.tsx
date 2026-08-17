'use client';

import React, { useState, useEffect, use, useCallback } from 'react';
import Link from 'next/link';
import { getAuctionById, initializeStore, Auction } from '@/lib/store';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import AuctionGallery from './components/AuctionGallery';
import AuctionBiddingCard from './components/AuctionBiddingCard';
import AuctionBidHistory, { Bid } from './components/AuctionBidHistory';

export default function AuctionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, isWatchlisted, toggleWatchlist } = useAuth();
  const { addToCart } = useCart();

  const [auction, setAuction] = useState<Auction | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [bidsHistory, setBidsHistory] = useState<Bid[]>([]);

  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
    isEnded: false,
  });

  useEffect(() => {
    let isMounted = true;

    async function loadAuctionData() {
      setLoading(true);
      await initializeStore();

      if (!isMounted) return;

      const foundAuction = getAuctionById(id);
      if (foundAuction) {
        setAuction(foundAuction);

        if (foundAuction.history && foundAuction.history.length > 0) {
          const mappedBids: Bid[] = foundAuction.history.map((b) => ({
            id: b.id,
            bidderName: b.bidderName,
            bidderAvatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(b.bidderName)}`,
            amount: b.amount,
            timestamp: new Date(b.time).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
          }));
          setBidsHistory(mappedBids);
        }
      }
      setLoading(false);
    }

    loadAuctionData();

    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    if (!auction) return;

    const calculateTimeLeft = () => {
      const diff = new Date(auction.endTime).getTime() - new Date().getTime();
      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isEnded: true });
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds, isEnded: false });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [auction]);

  const handlePlaceBid = useCallback(
    (amount: number) => {
      if (!auction) return;

      const newBid: Bid = {
        id: `bid_${Date.now()}`,
        bidderName: user?.name || 'You',
        bidderAvatar:
          user?.avatar || 'https://api.dicebear.com/9.x/avataaars/svg?seed=You',
        amount,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      };

      setBidsHistory((prev) => [newBid, ...prev]);
      setAuction((prev) =>
        prev
          ? {
              ...prev,
              currentHighestBid: amount,
              bidsCount: prev.bidsCount + 1,
            }
          : prev
      );
    },
    [auction, user]
  );

  const handleAddToCart = useCallback(() => {
    if (!auction) return;
    addToCart({
      id: auction.id,
      title: auction.title,
      price: auction.currentHighestBid,
      image: auction.images[0],
      sellerName: auction.sellerName,
    });
  }, [auction, addToCart]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto" />
        <p className="text-sm font-semibold text-slate-600">Loading auction item...</p>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-lg font-bold text-slate-800">Auction Listing Not Found</h2>
        <Link
          href="/auctions"
          className="inline-block bg-purple-600 text-white font-bold text-xs px-4 py-2 rounded-xl"
        >
          Back to Marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link href="/auctions" className="hover:text-purple-600">
          Marketplace
        </Link>
        <span>/</span>
        <span className="capitalize">{auction.category}</span>
        <span>/</span>
        <span className="text-slate-900 font-bold truncate max-w-xs">{auction.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          <AuctionGallery
            title={auction.title}
            images={auction.images}
            inWatchlist={isWatchlisted(auction.id)}
            onToggleWatchlist={() => toggleWatchlist(auction.id)}
          />

          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 shadow-sm">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Item Details
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
              {auction.description}
            </p>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <AuctionBiddingCard
            auctionId={auction.id}
            category={auction.category}
            title={auction.title}
            currentHighestBid={auction.currentHighestBid}
            minIncrement={auction.minIncrement}
            bidsCount={auction.bidsCount}
            timeLeft={timeLeft}
            onPlaceBid={handlePlaceBid}
            onAddToCart={handleAddToCart}
          />

          <AuctionBidHistory bids={bidsHistory} />
        </div>
      </div>
    </div>
  );
}