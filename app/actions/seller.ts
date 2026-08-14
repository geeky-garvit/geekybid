// app/actions/seller.ts
'use server';

import { addAuction } from '@/lib/data';
import { revalidatePath } from 'next/cache';

export async function createAuctionAction(prevState: any, formData: FormData) {
  const id = `user-${Date.now()}`;
  
  await addAuction({
    id,
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    category: (formData.get('category') as string) || 'general',
    startingPrice: Number(formData.get('startingPrice')) || 10,
    currentHighestBid: Number(formData.get('startingPrice')) || 10,
    minIncrement: 5,
    bidsCount: 0,
    images: ['https://picsum.photos/seed/new/600/600'],
    endTime: new Date(Date.now() + 86400000 * 7).toISOString(),
    status: 'live',
    history: [], // Added required property
    seller: {
      id: 'user-seller',
      name: 'Current User',
      avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=user',
      rating: 5.0,
    },
  });

  revalidatePath('/auctions', 'page');
  revalidatePath('/', 'layout');
}