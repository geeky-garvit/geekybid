// components/auction/OptimisticBidForm.tsx
'use client';

import { useOptimistic, useTransition } from 'react';
import { placeBidAction } from '@/app/actions/bid';

interface Props {
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
}: Props) {
  const [isPending, startTransition] = useTransition();

  const [optimisticState, setOptimisticState] = useOptimistic(
    { bid: currentHighestBid, count: bidsCount },
    (state, newAmount: number) => ({
      bid: newAmount,
      count: state.count + 1,
    })
  );

  async function handleSubmit(formData: FormData) {
    const rawAmount = formData.get('amount');
    const amount = Number(rawAmount);

    if (!amount || amount <= optimisticState.bid) {
      alert(`Bid must be greater than $${optimisticState.bid}`);
      return;
    }

    // Explicitly check for valid auctionId
    if (!auctionId) {
      console.error('Missing auctionId in OptimisticBidForm');
      return;
    }

    startTransition(async () => {
      setOptimisticState(amount);
      const res = await placeBidAction(auctionId, amount);

      if (!res?.success) {
        alert(res?.error || 'Failed to place bid');
      }
    });
  }

  return (
    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <span className="text-xs text-slate-500 uppercase font-bold">Current Bid</span>
          <div className="text-2xl font-black text-purple-950">
            ${optimisticState.bid}
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-500 uppercase font-bold">Total Bids</span>
          <div className="text-lg font-bold text-slate-700">{optimisticState.count}</div>
        </div>
      </div>

      <form action={handleSubmit} className="flex gap-2">
        {/* Fallback hidden input to guarantee auctionId is submitted */}
        <input type="hidden" name="auctionId" value={auctionId} />
        
        <input
          type="number"
          name="amount"
          defaultValue={optimisticState.bid + minIncrement}
          min={optimisticState.bid + minIncrement}
          step={minIncrement}
          required
          className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
        />
        <button
          type="submit"
          disabled={isPending}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-5 py-2 rounded-xl text-sm transition-all disabled:opacity-50"
        >
          {isPending ? 'Placing...' : 'Place Bid'}
        </button>
      </form>
    </div>
  );
}