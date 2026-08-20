'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

export interface Bid {
  id: string;
  bidderName: string;
  amount: number;
  time: string | Date;
}

interface Props {
  auctionId: string;
  initialHighestBid: number;
  minIncrement: number;
  initialBidsCount: number;
  initialHistory: Bid[];
  endTime?: string | Date; // Added endTime to validate expiration
}

export default function BidForm({
  auctionId,
  initialHighestBid,
  minIncrement,
  initialBidsCount,
  initialHistory,
  endTime,
}: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const [isPending, setIsPending] = useState(false);

  const [highestBid, setHighestBid] = useState(initialHighestBid);
  const [bidsCount, setBidsCount] = useState(initialBidsCount);
  const [history, setHistory] = useState<Bid[]>(initialHistory);

  const minAllowed = highestBid + minIncrement;
  const [amount, setAmount] = useState(minAllowed);

  // Check if auction is active and has valid time remaining
  const isAuctionExpired = endTime ? new Date(endTime).getTime() <= Date.now() : false;

  const maskName = (name: string) => {
    if (!name || name.length <= 2) return 'a***r';
    return `${name[0]}***${name[name.length - 1]}`;
  };

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();

    // 0. Check auction expiration
    if (isAuctionExpired) {
      toast.error('Auction Has Ended!', {
        description: 'You can no longer place bids on this item.',
      });
      return;
    }

    // 1. Unauthenticated users get Sonner toast & option to sign in
    if (!user) {
      toast.error('You must be signed in to place a bid!', {
        description: 'Please sign in to your account to participate in this auction.',
        action: {
          label: 'Sign In',
          onClick: () => router.push(`/login?redirectTo=/auctions/${auctionId}`),
        },
      });
      return;
    }

    // 2. Validate bid amount
    if (amount < minAllowed) {
      toast.error(`Bid amount too low!`, {
        description: `Your bid must be at least $${minAllowed.toFixed(2)}.`,
      });
      return;
    }

    setIsPending(true);

    try {
      const res = await fetch('/api/bids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ auctionId, amount }),
      });

      const data = await res.json().catch(() => ({
        success: false,
        message: 'Unexpected server error response.',
      }));

      if (!res.ok) {
        if (res.status === 401) {
          toast.error('Session expired. Please log in again.', {
            action: {
              label: 'Sign In',
              onClick: () => router.push(`/login?redirectTo=/auctions/${auctionId}`),
            },
          });
          return;
        }
        throw new Error(data.message || `Server error (${res.status})`);
      }

      // Update state and show success toast
      const newBid: Bid = {
        id: Date.now().toString(),
        bidderName: user.name || 'You',
        amount,
        time: new Date().toISOString(),
      };

      setHighestBid(amount);
      setBidsCount((prev) => prev + 1);
      setHistory((prev) => [newBid, ...prev]);
      setAmount(amount + minIncrement);

      toast.success(data.message || 'Bid placed successfully!');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to place bid.');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Bid Input Box */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Current Highest Bid
            </span>
            <span className="text-3xl font-black text-purple-950">
              ${highestBid.toFixed(2)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Total Bids
            </span>
            <span className="text-xl font-black text-purple-900">{bidsCount}</span>
          </div>
        </div>

        <form onSubmit={handleAction} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Your Bid ($) — Min: ${minAllowed.toFixed(2)}
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full p-3 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-purple-600 outline-none transition disabled:bg-slate-50"
              disabled={isPending || isAuctionExpired}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isPending || isAuctionExpired}
            className={`w-full font-bold py-3 rounded-xl transition shadow-sm ${
              isAuctionExpired
                ? 'bg-red-100 text-red-600 cursor-not-allowed'
                : user
                ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/20'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isAuctionExpired
              ? 'Auction Ended'
              : isPending
              ? 'Placing Bid...'
              : user
              ? 'Place Bid'
              : 'Sign In to Place Bid'}
          </button>
        </form>
      </div>

      {/* Masked Bid History */}
      <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl">
        <h3 className="text-sm font-bold text-slate-800 mb-3">
          Bid History ({history.length})
        </h3>
        {history.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No bids placed yet. Be the first!</p>
        ) : (
          <div className="space-y-2">
            {history.map((bid) => (
              <div
                key={bid.id}
                className="flex justify-between items-center text-xs py-1.5 border-b border-slate-200/60 last:border-b-0"
              >
                <span className="font-semibold text-slate-700">{maskName(bid.bidderName)}</span>
                <span className="font-bold text-purple-950">${bid.amount.toFixed(2)}</span>
                <span className="text-[10px] text-slate-400">
                  {new Date(bid.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}