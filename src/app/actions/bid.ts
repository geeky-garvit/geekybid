// src/app/actions/bid.ts
'use server';

import { revalidatePath } from 'next/cache';
import { placeBid, store, Bid } from '@/lib/store';

export interface PlaceBidResponse {
  success: boolean;
  message: string;
  highestBid?: number;
  bidsCount?: number;
  history?: Bid[];
}

export async function placeBidAction(
  auctionId: string,
  amount: number
): Promise<PlaceBidResponse> {
  try {
    const currentUser = store.currentUser;

    if (!currentUser) {
      return {
        success: false,
        message: 'You must be logged in to place a bid.',
      };
    }

    // Execute bid logic inside global store (validates min bid, expiry, seller restrictions, and anti-sniping)
    const updatedAuction = placeBid(
      auctionId,
      amount,
      currentUser.id,
      currentUser.name
    );

    // Revalidate relevant Next.js routes to refresh server components
    revalidatePath(`/auction/${auctionId}`);
    revalidatePath('/auctions');
    revalidatePath('/profile');

    return {
      success: true,
      message: `🎉 Bid placed successfully! New highest bid: $${updatedAuction.currentHighestBid.toFixed(2)}`,
      highestBid: updatedAuction.currentHighestBid,
      bidsCount: updatedAuction.bidsCount,
      history: updatedAuction.history,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'An error occurred while placing your bid.';

    return {
      success: false,
      message: errorMessage,
    };
  }
}