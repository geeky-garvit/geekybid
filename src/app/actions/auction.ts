// src/app/actions/auction.ts
'use server';

import { revalidatePath } from 'next/cache';
import { createAuction, Auction } from '@/lib/store';

export async function createAuctionAction(
  data: Omit<Auction, 'id' | 'currentHighestBid' | 'bidsCount' | 'status' | 'history'>
) {
  const newAuction = createAuction(data);

  // Invalidate cache across all pages displaying marketplace data
  revalidatePath('/auctions');
  revalidatePath('/seller/dashboard');
  revalidatePath('/');

  return { success: true, auction: newAuction };
}