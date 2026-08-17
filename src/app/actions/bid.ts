// src/app/actions/bid.ts
'use server';

import { revalidatePath } from 'next/cache';
import { placeBid, store, Bid } from '@/lib/store';
import { syncAndSimulateAuctions } from '@/lib/auction-engine';

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
    // Keep global state fresh and resolve expired winners before placing a bid
    await syncAndSimulateAuctions();

    const currentUser = store.currentUser;

    if (!currentUser) {
      return {
        success: false,
        message: 'Authentication required. Please sign in to place a bid.',
      };
    }

    const updatedAuction = placeBid(
      auctionId,
      amount,
      currentUser.id,
      currentUser.name
    );

    // Revalidate paths for instant client UI synchronization
    revalidatePath(`/auction/${auctionId}`);
    revalidatePath('/auctions');
    revalidatePath('/profile');

    return {
      success: true,
      message: `Bid placed successfully. New highest bid: $${updatedAuction.currentHighestBid.toFixed(2)}`,
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