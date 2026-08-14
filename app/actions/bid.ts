'use server';

import { placeBid } from '@/lib/data';
import { revalidatePath } from 'next/cache';

export async function placeBidAction(auctionId: string, amount: number) {
  const updated = await placeBid(auctionId, amount);

  if (!updated) {
    return { success: false, error: 'Auction not found or expired.' };
  }

  revalidatePath(`/auction/${auctionId}`, 'page');
  revalidatePath('/auctions', 'page');
  revalidatePath('/', 'layout');

  return { success: true, auction: updated };
}