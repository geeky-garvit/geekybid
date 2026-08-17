'use server';

import { revalidatePath } from 'next/cache';
import {
  createAuction,
  getAuctions,
  saveAuctions,
  store,
  Auction,
} from '@/lib/store';

export type CreateAuctionInput = Omit<
  Auction,
  'id' | 'currentHighestBid' | 'bidsCount' | 'status' | 'history'
>;

export interface UpdateAuctionPayload {
  id: string;
  title: string;
  category: string;
  description: string;
}

// Auction Creation Action used by seller/create/page.tsx
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

// Auction Update Action used by seller/edit/[id]/page.tsx
export async function updateAuctionAction(payload: UpdateAuctionPayload) {
  try {
    const auctions = getAuctions();
    const index = auctions.findIndex((a) => a.id === payload.id);

    if (index === -1) {
      return { success: false, error: 'Auction not found.' };
    }

    if (auctions[index].bidsCount > 0) {
      return { success: false, error: 'Cannot edit an auction with existing bids.' };
    }

    auctions[index] = {
      ...auctions[index],
      title: payload.title,
      category: payload.category,
      description: payload.description,
    };

    saveAuctions(auctions);

    revalidatePath(`/auction/${payload.id}`);
    revalidatePath('/seller/dashboard');
    revalidatePath('/auctions');

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to update auction.',
    };
  }
}

// Admin Actions used by admin components
export async function adminCloseAuctionAction(auctionId: string) {
  try {
    const auction = store.auctions.find((a) => a.id === auctionId);
    if (!auction) return { success: false, error: 'Auction not found' };

    auction.status = 'ended';

    revalidatePath('/auctions');
    revalidatePath(`/auction/${auctionId}`);
    revalidatePath('/admin');
    revalidatePath('/');

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to close auction',
    };
  }
}

export async function adminDeleteAuctionAction(auctionId: string) {
  try {
    store.auctions = store.auctions.filter((a) => a.id !== auctionId);

    revalidatePath('/auctions');
    revalidatePath('/admin');
    revalidatePath('/');

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete auction',
    };
  }
}

export async function adminTogglePaymentStatusAction(orderId: string) {
  try {
    const order = store.orders.find((o) => o.id === orderId);
    if (!order) return { success: false, error: 'Order not found' };

    order.isPaid = !order.isPaid;

    revalidatePath('/admin');
    revalidatePath('/orders');

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update order status',
    };
  }
}