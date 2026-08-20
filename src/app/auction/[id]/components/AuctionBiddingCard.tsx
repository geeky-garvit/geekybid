'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
  isEnded: boolean;
}

interface AuctionBiddingCardProps {
  auctionId: string;
  category: string;
  title: string;
  currentHighestBid: number;
  minIncrement: number;
  bidsCount: number;
  timeLeft: TimeLeft;
  onPlaceBid: (amount: number) => void;
  onAddToCart: () => void;
}

export default function AuctionBiddingCard({
  auctionId,
  category,
  title,
  currentHighestBid,
  minIncrement,
  bidsCount,
  timeLeft,
  onPlaceBid,
  onAddToCart,
}: AuctionBiddingCardProps) {
  const { user } = useAuth();
  const router = useRouter();

  const [bidInput, setBidInput] = useState<string>('');
  const [cartAdded, setCartAdded] = useState<boolean>(false);

  const minBidAllowed = currentHighestBid + minIncrement;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Unauthenticated check
    if (!user) {
      toast.error('Sign in required to place a bid!', {
        description: 'Please sign in to your account to participate in this auction.',
        action: {
          label: 'Sign In',
          onClick: () => router.push(`/login?redirectTo=/auctions/${auctionId}`),
        },
      });
      return;
    }

    const amount = parseFloat(bidInput);

    // 2. Bid amount validation
    if (isNaN(amount) || amount < minBidAllowed) {
      toast.error('Bid amount too low!', {
        description: `Minimum bid required is $${minBidAllowed.toFixed(2)}.`,
      });
      return;
    }

    onPlaceBid(amount);
    setBidInput('');
    toast.success('Bid placed successfully!');
  };

  const handleCartClick = () => {
    if (!user) {
      toast.error('Sign in required to add items to cart!', {
        description: 'Please sign in to save items to your shopping cart.',
        action: {
          label: 'Sign In',
          onClick: () => router.push(`/login?redirectTo=/auctions/${auctionId}`),
        },
      });
      return;
    }

    onAddToCart();
    setCartAdded(true);
    toast.success('Added to your cart!');
    setTimeout(() => setCartAdded(false), 2000);
  };

  const handleBuyNowClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      toast.error('Sign in required to proceed to checkout!', {
        description: 'Please sign in to complete your purchase.',
        action: {
          label: 'Sign In',
          onClick: () => router.push(`/login?redirectTo=/checkout?auctionId=${auctionId}`),
        },
      });
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
      <div>
        <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest">
          {category}
        </span>
        <h1 className="text-xl font-black text-slate-900 mt-1">{title}</h1>
      </div>

      <div className="bg-purple-950 text-white rounded-xl p-4 flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold text-purple-300 block">
            Time Remaining
          </span>
          {timeLeft.isEnded ? (
            <span className="text-sm font-bold text-rose-400">Auction Ended</span>
          ) : (
            <span className="text-lg font-black tracking-wider">
              {String(timeLeft.hours).padStart(2, '0')}h :{' '}
              {String(timeLeft.minutes).padStart(2, '0')}m :{' '}
              {String(timeLeft.seconds).padStart(2, '0')}s
            </span>
          )}
        </div>
      </div>

      <div className="flex items-end justify-between border-b pb-4">
        <div>
          <span className="text-xs text-slate-500 font-semibold block">Current High Bid</span>
          <span className="text-3xl font-black text-purple-950">
            ${currentHighestBid.toFixed(2)}
          </span>
        </div>
        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
          {bidsCount} total bids
        </span>
      </div>

      {!timeLeft.isEnded ? (
        <div className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-3">
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
              className={`w-full font-bold py-3 rounded-xl text-xs transition shadow-md ${
                user
                  ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/20'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              {user ? 'Place Bid Now' : 'Sign In to Place Bid'}
            </button>
          </form>

          <button
            type="button"
            onClick={handleCartClick}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 rounded-xl text-xs transition"
          >
            {cartAdded ? 'Added to Cart' : 'Add to Cart'}
          </button>
        </div>
      ) : (
        <div className="bg-slate-100 p-4 rounded-xl text-center space-y-3">
          <p className="text-xs font-bold text-slate-700">This auction has concluded.</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCartClick}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-3 py-2.5 rounded-xl transition"
            >
              Add to Cart
            </button>
            <Link
              href={`/checkout?auctionId=${auctionId}`}
              onClick={handleBuyNowClick}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2.5 rounded-xl flex items-center justify-center"
            >
              Buy Now
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}