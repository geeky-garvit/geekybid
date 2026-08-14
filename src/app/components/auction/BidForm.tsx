// components/auction/BidForm.tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { placeBidAction } from '@/app/actions/bid';
import { Bid } from '@/lib/store';

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
  const [isPending, startTransition] = useTransition();

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    startTransition(async () => {
      const res = await placeBidAction(auctionId, amount);

      if (res.success && res.highestBid && res.bidsCount) {
        // Direct local state sync
        setHighestBid(res.highestBid);
        setBidsCount(res.bidsCount);
        if (res.history) setHistory(res.history);
        setAmount(res.highestBid + minIncrement);
        setStatus({ success: true, text: res.message });

        // Tell Next.js to refresh server components
        router.refresh();
      } else {
        setStatus({ success: false, text: res.message });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b pb-4">
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

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Your Bid ($) — Min: ${minAllowed.toFixed(2)}
            </label>
            <input
              type="number"
              step="0.01"
              min={minAllowed}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full p-3 border rounded-xl font-bold focus:ring-2 focus:ring-purple-600 outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-50"
          >
            {isPending ? 'Placing Bid...' : 'Place Bid'}
          </button>
        </form>

        {status && (
          <div
            className={`p-3 rounded-xl text-xs font-bold ${
              status.success ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}
          >
            {status.text}
          </div>
        )}
      </div>

      {/* Masked Bid History */}
      <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl">
        <h3 className="text-sm font-bold text-slate-800 mb-3">Bid History ({history.length})</h3>
        {history.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No bids placed yet. Be the first!</p>
        ) : (
          <div className="space-y-2">
            {history.map((bid) => (
              <div key={bid.id} className="flex justify-between items-center text-xs py-1 border-b border-slate-200/60">
                <span className="font-semibold text-slate-700">{maskName(bid.bidderName)}</span>
                <span className="font-bold text-purple-950">${bid.amount.toFixed(2)}</span>
                <span className="text-[10px] text-slate-400">
                  {new Date(bid.time).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}