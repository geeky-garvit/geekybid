'use client';

import { useOptimistic, useTransition, useState } from 'react';
import { placeBidAction } from '@/app/actions/bid';

interface OptimisticBidFormProps {
  auctionId: string;
  currentHighestBid: number;
  minIncrement: number;
  bidsCount: number;
  endTime: string;
}

export default function OptimisticBidForm({
  auctionId,
  currentHighestBid,
  minIncrement,
  bidsCount,
  endTime,
}: OptimisticBidFormProps) {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Optimistic state management for live bid updates
  const [optimisticBid, setOptimisticBid] = useOptimistic(
    { highestBid: currentHighestBid, count: bidsCount, endTime },
    (state, newBidAmount: number) => ({
      highestBid: newBidAmount,
      count: state.count + 1,
      endTime: state.endTime,
    })
  );

  const minBidAllowed = optimisticBid.highestBid + minIncrement;
  const [bidInput, setBidInput] = useState<number>(minBidAllowed);

  async function handleFormSubmit(formData: FormData) {
    const enteredAmount = Number(formData.get('amount'));
    setFeedback(null);

    // Apply optimistic state instantly
    startTransition(async () => {
      setOptimisticBid(enteredAmount);

      const res = await placeBidAction(null, formData);

      if (res.success) {
        setFeedback({ type: 'success', text: res.message });
        if (res.newHighestBid) {
          setBidInput(res.newHighestBid + minIncrement);
        }
      } else {
        setFeedback({ type: 'error', text: res.message });
      }
    });
  }

  return (
    <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-5 space-y-4">
      <div className="flex items-baseline justify-between">
        <div>
          <span className="text-xs text-purple-900/60 font-semibold uppercase tracking-wider block">Current Highest Bid</span>
          <span className="text-3xl font-black text-purple-950 tracking-tight">
            ${optimisticBid.highestBid.toLocaleString()}
          </span>
        </div>
        <div className="text-right">
          <span className="text-xs text-purple-900/60 font-semibold uppercase tracking-wider block">Total Bids</span>
          <span className="text-lg font-bold text-slate-800">{optimisticBid.count} bids</span>
        </div>
      </div>

      <form action={handleFormSubmit} className="space-y-3">
        <input type="hidden" name="auctionId" value={auctionId} />
        <input type="hidden" name="currentHighestBid" value={optimisticBid.highestBid} />
        <input type="hidden" name="minIncrement" value={minIncrement} />
        <input type="hidden" name="endTime" value={optimisticBid.endTime} />

        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
            <input
              type="number"
              name="amount"
              step="1"
              min={minBidAllowed}
              value={bidInput}
              onChange={(e) => setBidInput(Number(e.target.value))}
              required
              className="w-full pl-8 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-bold text-sm rounded-xl transition-all disabled:opacity-50 shadow-md shadow-purple-600/20"
          >
            {isPending ? 'Placing...' : 'Place Bid'}
          </button>
        </div>
      </form>

      {feedback && (
        <div
          className={`text-xs p-3 rounded-xl font-semibold border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {feedback.text}
        </div>
      )}
    </div>
  );
}
