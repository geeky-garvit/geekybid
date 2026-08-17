'use server';

import { revalidatePath } from 'next/cache';
import { getAuctions, placeBid, Bid } from '@/lib/store';
import { syncAndSimulateAuctions } from '@/lib/auction-engine';
import { getCurrentUser } from '@/lib/auth';

export interface PlaceBidResponse {
  success: boolean;
  message: string;
  highestBid?: number;
  bidsCount?: number;
  history?: Bid[];
  newEndTime?: string;
  timeExtended?: boolean;
}

export async function placeBidAction(
  auctionId: string,
  amount: number
): Promise<PlaceBidResponse> {
  try {
    // 1. Keep store states updated and finalize naturally expired items first
    await syncAndSimulateAuctions();

    // 2. Validate user session
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return {
        success: false,
        message: 'Authentication required. Please sign in to place a bid.',
      };
    }

    // 3. Locate target auction and verify strict server-side end time
    const auction = getAuctions().find((item) => item.id === auctionId);
    if (!auction) {
      return {
        success: false,
        message: 'Auction listing not found.',
      };
    }

    const currentServerTime = Date.now();
    const auctionEndTime = new Date(auction.endTime).getTime();

    if (currentServerTime >= auctionEndTime || auction.status === 'ended') {
      return {
        success: false,
        message: 'Bidding closed! This auction has ended.',
      };
    }

    // 4. placeBid owns the anti-sniping rule, so every caller gets identical behavior.
    const originalEndTime = auction.endTime;
    const updatedAuction = placeBid(
      auctionId,
      amount,
      currentUser.id,
      currentUser.name
    );
    const timeExtended = updatedAuction.endTime !== originalEndTime;

    // 5. Purge Next.js static cache so all users immediately see updated price/time
    revalidatePath(`/auction/${auctionId}`);
    revalidatePath('/auctions');
    revalidatePath('/seller/dashboard');
    revalidatePath('/');

    return {
      success: true,
      message: timeExtended
        ? `Bid accepted! ⚡ Anti-sniping protection activated: Time extended by 2 minutes.`
        : `Bid placed successfully. New highest bid: $${updatedAuction.currentHighestBid.toFixed(2)}`,
      highestBid: updatedAuction.currentHighestBid,
      bidsCount: updatedAuction.bidsCount,
      history: updatedAuction.history,
      newEndTime: updatedAuction.endTime,
      timeExtended,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred while placing your bid.',
    };
  }
}
