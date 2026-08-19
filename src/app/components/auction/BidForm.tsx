'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
}

export default function BidForm({
  auctionId,
  initialHighestBid,
  minIncrement,
  initialBidsCount,
  initialHistory,
}: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const [isPending, setIsPending] = useState(false);

  const [highestBid, setHighestBid] = useState(initialHighestBid);
  const [bidsCount, setBidsCount] = useState(initialBidsCount);
  const [history, setHistory] = useState<Bid[]>(initialHistory);

  const minAllowed = highestBid + minIncrement;
  const [amount, setAmount] = useState(minAllowed);
  const [status, setStatus] = useState<{ success: boolean; text: string } | null>(null);

  const maskName = (name: string) => {
    if (!name || name.length <= 2) return 'a***r';
    return `${name[0]}***${name[name.length - 1]}`;
  };

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    // 1. Unauthenticated users redirected to login
    if (!user) {
      router.push(`/login?redirectTo=/auctions/${auctionId}`);
      return;
    }

    // 2. Validate bid amount before making request
    if (amount < minAllowed) {
      setStatus({
        success: false,
        text: `Bid must be at least $${minAllowed.toFixed(2)}.`,
      });
      return;
    }

    setIsPending(true);

    try {
      // 3. Send request with credentials so JWT cookies are passed to /api/bids
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
          setStatus({ success: false, text: 'Session expired. Please log in again.' });
          router.push(`/login?redirectTo=/auctions/${auctionId}`);
          return;
        }
        throw new Error(data.message || `Server error (${res.status})`);
      }

      // 4. Update local state on success
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
      setStatus({ success: true, text: data.message || 'Bid placed successfully!' });

      router.refresh();
    } catch (error) {
      setStatus({
        success: false,
        text: error instanceof Error ? error.message : 'Unable to place bid.',
      });
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
              disabled={!user || isPending}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className={`w-full font-bold py-3 rounded-xl transition shadow-sm ${
              user
                ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/20'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isPending
              ? 'Placing Bid...'
              : user
              ? 'Place Bid'
              : 'Sign In to Place Bid'}
          </button>
        </form>

        {status && (
          <div
            className={`p-3 rounded-xl text-xs font-bold ${
              status.success
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            {status.text}
          </div>
        )}
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