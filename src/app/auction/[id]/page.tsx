'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getAuctionById, initializeStore, Auction } from '@/lib/store';
import { useAuth } from '@/context/AuthContext';

interface Bid {
  id: string;
  bidderName: string;
  bidderAvatar: string;
  amount: number;
  timestamp: string;
}

export default function AuctionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, isWatchlisted, toggleWatchlist } = useAuth();

  const [auction, setAuction] = useState<Auction | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [bidInput, setBidInput] = useState<string>('');
  const [bidsHistory, setBidsHistory] = useState<Bid[]>([]);

  // Countdown State
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number; isEnded: boolean }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    isEnded: false,
  });

  // 1. Initialize Store & Fetch Auction Data
  useEffect(() => {
    let isMounted = true;

    async function loadAuctionData() {
      setLoading(true);
      await initializeStore();

      if (!isMounted) return;

      const foundAuction = getAuctionById(id);
      if (foundAuction) {
        setAuction(foundAuction);
        setSelectedImage(foundAuction.images[0] || '');

        // Map initial store history if present
        if (foundAuction.history && foundAuction.history.length > 0) {
          const mappedBids: Bid[] = foundAuction.history.map((b) => ({
            id: b.id,
            bidderName: b.bidderName,
            bidderAvatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(b.bidderName)}`,
            amount: b.amount,
            timestamp: new Date(b.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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

  // 2. Live Countdown Timer Effect
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

  // 3. Simulated Competitor Bids Effect
  useEffect(() => {
    if (!auction || timeLeft.isEnded) return;

    const interval = setInterval(() => {
      const randomIncrement = Math.floor(Math.random() * 15) + 5;
      setAuction((prev) => {
        if (!prev) return prev;
        const newBidAmount = prev.currentHighestBid + randomIncrement;

        const newBidderName = 'Bot_Bidder_' + Math.floor(Math.random() * 100);
        const newBid: Bid = {
          id: `bid_${Date.now()}`,
          bidderName: newBidderName,
          bidderAvatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(newBidderName)}`,
          amount: newBidAmount,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        };

        setBidsHistory((history) => [newBid, ...history]);

        return {
          ...prev,
          currentHighestBid: newBidAmount,
          bidsCount: prev.bidsCount + 1,
        };
      });
    }, 20000);

    return () => clearInterval(interval);
  }, [auction, timeLeft.isEnded]);

  // Loading Skeleton State
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        <p className="text-sm font-semibold text-slate-600">Loading auction item...</p>
      </div>
    );
  }

  // Not Found Fallback
  if (!auction) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <span className="text-4xl">🔎</span>
        <h2 className="text-lg font-bold text-slate-800">Auction Listing Not Found</h2>
        <Link href="/auctions" className="inline-block bg-purple-600 text-white font-bold text-xs px-4 py-2 rounded-xl">
          Back to Marketplace
        </Link>
      </div>
    );
  }

  const minBidAllowed = auction.currentHighestBid + auction.minIncrement;

  const handlePlaceBid = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(bidInput);

    if (isNaN(amount) || amount < minBidAllowed) {
      alert(`Your bid must be at least $${minBidAllowed.toFixed(2)} ($${auction.minIncrement} higher than current bid).`);
      return;
    }

    const newBid: Bid = {
      id: `bid_${Date.now()}`,
      bidderName: user?.name || 'You',
      bidderAvatar: user?.avatar || 'https://api.dicebear.com/9.x/avataaars/svg?seed=You',
      amount,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };

    setBidsHistory([newBid, ...bidsHistory]);
    setAuction({
      ...auction,
      currentHighestBid: amount,
      bidsCount: auction.bidsCount + 1,
    });

    setBidInput('');
    alert('🎉 Bid placed successfully!');
  };

  const inWatchlist = isWatchlisted(auction.id);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Breadcrumb Navigation */}
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
        {/* Left Column: Image Gallery & Description */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4 shadow-sm">
            <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-100">
              <Image
                src={selectedImage || auction.images[0]}
                alt={auction.title}
                fill
                className="object-cover"
                priority
              />
              <button
                onClick={() => toggleWatchlist(auction.id)}
                className="absolute top-4 right-4 bg-white/90 p-2.5 rounded-full shadow hover:bg-white transition"
              >
                {inWatchlist ? '❤️' : '🤍'}
              </button>
            </div>

            {/* Thumbnail Switcher */}
            {auction.images.length > 1 && (
              <div className="flex gap-3">
                {auction.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition ${
                      selectedImage === img ? 'border-purple-600' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <Image src={img} alt="Thumbnail" fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Item Description */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 shadow-sm">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Item Details</h2>
            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{auction.description}</p>
          </div>
        </div>

        {/* Right Column: Bidding Controls & History */}
        <div className="lg:col-span-5 space-y-6">
          {/* Main Bidding Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
            <div>
              <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest">{auction.category}</span>
              <h1 className="text-xl font-black text-slate-900 mt-1">{auction.title}</h1>
            </div>

            {/* Timer Box */}
            <div className="bg-purple-950 text-white rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-purple-300 block">Time Remaining</span>
                {timeLeft.isEnded ? (
                  <span className="text-sm font-bold text-rose-400">Auction Ended</span>
                ) : (
                  <span className="text-lg font-black tracking-wider">
                    {String(timeLeft.hours).padStart(2, '0')}h : {String(timeLeft.minutes).padStart(2, '0')}m :{' '}
                    {String(timeLeft.seconds).padStart(2, '0')}s
                  </span>
                )}
              </div>
              <span className="text-2xl animate-pulse">⏰</span>
            </div>

            {/* Current Price Display */}
            <div className="flex items-end justify-between border-b pb-4">
              <div>
                <span className="text-xs text-slate-500 font-semibold block">Current High Bid</span>
                <span className="text-3xl font-black text-purple-950">${auction.currentHighestBid.toFixed(2)}</span>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                {auction.bidsCount} total bids
              </span>
            </div>

            {/* Bid Input Form */}
            {!timeLeft.isEnded ? (
              <form onSubmit={handlePlaceBid} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Enter Amount (Min: ${minBidAllowed.toFixed(2)})
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-xs font-bold text-slate-400">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min={minBidAllowed}
                      value={bidInput}
                      onChange={(e) => setBidInput(e.target.value)}
                      placeholder={minBidAllowed.toFixed(2)}
                      className="w-full pl-7 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-purple-600 outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl text-xs transition shadow-md shadow-purple-600/20"
                >
                  Place Bid Now
                </button>
              </form>
            ) : (
              <div className="bg-slate-100 p-4 rounded-xl text-center space-y-2">
                <p className="text-xs font-bold text-slate-700">This auction has concluded.</p>
                <Link
                  href={`/checkout?auctionId=${auction.id}`}
                  className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl"
                >
                  Proceed to Winner Checkout
                </Link>
              </div>
            )}
          </div>

          {/* Bid History Log */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex justify-between items-center">
              <span>Bid History</span>
              <span className="text-[10px] text-slate-400 font-normal">Real-time update</span>
            </h3>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {bidsHistory.map((bid) => (
                <div key={bid.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="relative w-7 h-7 rounded-full overflow-hidden border bg-white">
                      <Image src={bid.bidderAvatar} alt={bid.bidderName} fill />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{bid.bidderName}</p>
                      <span className="text-[10px] text-slate-400">{bid.timestamp}</span>
                    </div>
                  </div>
                  <span className="font-black text-purple-950">${bid.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}