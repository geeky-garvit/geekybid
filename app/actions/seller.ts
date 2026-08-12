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

  if (!title || !description || !category || isNaN(startingPrice) || startingPrice <= 0) {
    return { error: 'Please fill in all required fields with valid values.' };
  }

  // Revalidate cache for auction lists
  revalidatePath('/auctions');
  revalidatePath('/seller/dashboard');
  revalidatePath('/');

  // Redirect outside try/catch
  redirect('/seller/dashboard');
}
