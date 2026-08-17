'use server';

import { revalidatePath } from 'next/cache';
import { createAuction, Auction } from '@/lib/store';

export type CreateAuctionInput = Omit<
  Auction,
  'id' | 'currentHighestBid' | 'bidsCount' | 'status' | 'history'
>;

export async function createAuctionAction(data: CreateAuctionInput) {
  try {
    const newAuction = createAuction(data);

    revalidatePath('/auctions');
    revalidatePath('/seller/dashboard');
    revalidatePath('/');

    return { success: true, auction: newAuction };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create auction listing.',
    };
  }
}