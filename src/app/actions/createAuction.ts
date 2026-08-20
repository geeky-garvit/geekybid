'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createAuctionAction(formData: {
  title: string;
  description: string;
  category: string;
  startingBid: number;
  minIncrement?: number;
  images: string[];
  endTime: string; // Datetime string
  sellerId: string;
}) {
  const endTimeDate = new Date(formData.endTime);
  const minAllowedTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes in future

  if (endTimeDate < minAllowedTime) {
    throw new Error('Auction end time must be at least 5 minutes from now.');
  }

  const newAuction = await prisma.auction.create({
    data: {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      startingBid: formData.startingBid,
      currentPrice: formData.startingBid,
      minIncrement: formData.minIncrement || 5.0,
      images: formData.images.length > 0 ? formData.images : ['https://cdn.dummyjson.com/product-images/1/thumbnail.jpg'],
      endTime: endTimeDate,
      status: 'ACTIVE',
      sellerId: formData.sellerId,
    },
  });

  // Log Activity for Seller
  await prisma.activity.create({
    data: {
      action: 'AUCTION_CREATED',
      details: `Created auction "${newAuction.title}"`,
      amount: formData.startingBid,
      userId: formData.sellerId,
    },
  });

  revalidatePath('/auctions');
  revalidatePath('/dashboard');

  return newAuction;
}