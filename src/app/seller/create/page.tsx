'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { createAuction } from '@/lib/store';
import ItemDetailsSection from './components/ItemDetailsSection';
import PricingSection from './components/PricingSection';
import ImageUploaderSection from './components/ImageUploaderSection';

const CATEGORIES = ['electronics', 'art', 'collectibles', 'fashion', 'jewelry'];
const MIN_DURATION_MINUTES = 5;

export default function CreateAuctionPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isPending, setIsPending] = useState(false);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [startingBid, setStartingBid] = useState('');
  const [reservePrice, setReservePrice] = useState('');
  
  // Changed duration to minutes with default minimum of 5 minutes
  const [durationMinutes, setDurationMinutes] = useState<number>(5);

  const [imageUrls, setImageUrls] = useState<string[]>([
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop',
  ]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <span className="text-3xl block">👤</span>
        <p className="text-slate-600 font-bold text-sm">
          Please select or log into a seller profile to create an auction listing.
        </p>
        <Link
          href="/login"
          className="inline-block bg-purple-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-purple-700 transition"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const handleAddImageUrl = (url: string) => {
    if (!url.trim()) return;
    setImageUrls((prev) => [...prev, url.trim()]);
  };

  const handleRemoveImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Please enter a listing title.');
      return;
    }

    // 1. Duration Validation: Must be at least 5 minutes
    if (isNaN(durationMinutes) || durationMinutes < MIN_DURATION_MINUTES) {
      toast.error('Invalid Duration!', {
        description: `Minimum auction duration must be at least ${MIN_DURATION_MINUTES} minutes.`,
      });
      return;
    }

    const startPrice = parseFloat(startingBid);
    if (isNaN(startPrice) || startPrice <= 0) {
      toast.error('Please enter a valid starting price greater than $0.');
      return;
    }

    const parsedReserve = reservePrice ? parseFloat(reservePrice) : undefined;
    if (parsedReserve !== undefined && (isNaN(parsedReserve) || parsedReserve < startPrice)) {
      toast.error('Reserve price must be greater than or equal to the starting bid.');
      return;
    }

    if (imageUrls.length === 0) {
      toast.error('Please provide at least one image URL for the auction item.');
      return;
    }

    // Calculate endTime in milliseconds (minutes * 60 * 1000)
    const endTime = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();

    setIsPending(true);
    try {
      createAuction({
        title: title.trim(),
        category,
        description: description.trim(),
        startingPrice: startPrice,
        minIncrement: 5,
        endTime,
        images: imageUrls,
        sellerId: user.id,
        sellerName: user.name,
        sellerAvatar: user.avatar,
      });

      toast.success('Auction published successfully!');
      router.push('/seller/dashboard');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create auction.');
      setIsPending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-purple-600">
            Seller Portal • {user.name}
          </span>
          <h1 className="text-2xl font-black text-slate-900 mt-0.5">List a New Item</h1>
        </div>
        <Link
          href="/seller/dashboard"
          className="text-xs font-bold text-slate-600 hover:text-purple-600 transition"
        >
          ← Back to Dashboard
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <ItemDetailsSection
          title={title}
          setTitle={setTitle}
          category={category}
          setCategory={setCategory}
          durationMinutes={durationMinutes}
          setDurationMinutes={setDurationMinutes}
          minDurationMinutes={MIN_DURATION_MINUTES}
          description={description}
          setDescription={setDescription}
          categories={CATEGORIES}
        />

        <PricingSection
          startingBid={startingBid}
          setStartingBid={setStartingBid}
          reservePrice={reservePrice}
          setReservePrice={setReservePrice}
        />

        <ImageUploaderSection
          imageUrls={imageUrls}
          onAddImage={handleAddImageUrl}
          onRemoveImage={handleRemoveImage}
        />

        <div className="flex gap-3 justify-end pt-2">
          <Link
            href="/seller/dashboard"
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-6 py-3 rounded-xl transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs px-8 py-3 rounded-xl transition shadow-md shadow-purple-600/20"
          >
            {isPending ? 'Publishing...' : 'Publish Live Auction'}
          </button>
        </div>
      </form>
    </div>
  );
}