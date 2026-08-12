'use me';
'use server';

import { revalidatePath } from 'next/cache';

export interface BidState {
  success: boolean;
  message: string;
  newHighestBid?: number;
  newBidsCount?: number;
  newEndTime?: string;
}

export async function placeBidAction(
  prevState: BidState | null,
  formData: FormData
): Promise<BidState> {
  const auctionId = formData.get('auctionId') as string;
  const amountStr = formData.get('amount') as string;
  const currentBidStr = formData.get('currentHighestBid') as string;
  const minIncrementStr = formData.get('minIncrement') as string;
  const endTimeStr = formData.get('endTime') as string;

  const amount = Number(amountStr);
  const currentBid = Number(currentBidStr);
  const minIncrement = Number(minIncrementStr) || 5;

  if (!auctionId || isNaN(amount)) {
    return { success: false, message: 'Invalid bid data.' };
  }

  if (amount < currentBid + minIncrement) {
    return {
      success: false,
      message: `Bid must be at least $${(currentBid + minIncrement).toFixed(2)} ($${minIncrement} min increment).`,
    };
  }

  // Anti-sniping check: extend end time if bid placed in last 2 minutes
  let newEndTime = endTimeStr;
  const now = Date.now();
  const end = new Date(endTimeStr).getTime();
  const timeRemainingMs = end - now;

  if (timeRemainingMs > 0 && timeRemainingMs <= 2 * 60 * 1000) {
    // Add 2 minutes
    newEndTime = new Date(end + 2 * 60 * 1000).toISOString();
  }

  // Revalidate detail page and marketplace listing
  revalidatePath(`/auction/${auctionId}`);
  revalidatePath('/auctions');

  return {
    success: true,
    message: `Bid of $${amount.toFixed(2)} placed successfully!`,
    newHighestBid: amount,
    newEndTime,
  };
}
