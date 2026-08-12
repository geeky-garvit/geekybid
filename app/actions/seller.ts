'use me';
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export interface CreateAuctionState {
  error?: string;
}

export async function createAuctionAction(
  prevState: CreateAuctionState | null,
  formData: FormData
): Promise<CreateAuctionState> {
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const category = formData.get('category') as string;
  const startingPrice = Number(formData.get('startingPrice'));
  const minIncrement = Number(formData.get('minIncrement')) || 5;
  const durationHours = Number(formData.get('durationHours')) || 24;

  if (!title || !description || !category || isNaN(startingPrice) || startingPrice <= 0) {
    return { error: 'Please fill in all required fields with valid values.' };
  }

  // Calculate end time based on duration selected
  const endTime = new Date(Date.now() + durationHours * 3600 * 1000).toISOString();

  // Revalidate marketplaces and seller dashboard
  revalidatePath('/auctions');
  revalidatePath('/seller/dashboard');
  revalidatePath('/');

  redirect('/seller/dashboard');
}
