'use server';

import { revalidatePath } from 'next/cache';
import { getAuctions, placeBid, updateAuctionEndTime, Bid } from '@/lib/store';
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

const ANTI_SNIPE_WINDOW_MS = 2 * 60 * 1000; // 2 minutes in milliseconds
const EXTENSION_DURATION_MS = 2 * 60 * 1000; // Extend by 2 minutes

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

    // 4. Anti-Sniping Check: Extend clock if bid occurs in final 2 minutes
    const timeRemainingMs = auctionEndTime - currentServerTime;
    let timeExtended = false;
    let finalEndTimeISO = auction.endTime;

    if (timeRemainingMs <= ANTI_SNIPE_WINDOW_MS) {
      const newEndTimeMs = currentServerTime + EXTENSION_DURATION_MS;
      finalEndTimeISO = new Date(newEndTimeMs).toISOString();

      // Persist extended end time back to server memory
      updateAuctionEndTime(auctionId, finalEndTimeISO);
      timeExtended = true;
    }

    // 5. Place the bid
    const updatedAuction = placeBid(
      auctionId,
      amount,
      currentUser.id,
      currentUser.name
    );

    // 6. Purge Next.js static cache so all users immediately see updated price/time
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
      newEndTime: finalEndTimeISO,
      timeExtended,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred while placing your bid.',
    };
  }
}