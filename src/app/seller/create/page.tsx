// src/app/seller/create/page.tsx
'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext'; // 1. Use Auth Context
import { createAuctionAction } from '@/app/actions/auction';
import ItemDetailsSection from './components/ItemDetailsSection';
import PricingSection from './components/PricingSection';
import ImageUploaderSection from './components/ImageUploaderSection';

const CATEGORIES = ['electronics', 'art', 'collectibles', 'fashion', 'jewelry'];

export default function CreateAuctionPage() {
  const router = useRouter();
  const { user } = useAuth(); // 2. Access active logged-in profile
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [startingBid, setStartingBid] = useState('');
  const [reservePrice, setReservePrice] = useState('');
  const [durationDays, setDurationDays] = useState<number>(3);

  const [imageUrls, setImageUrls] = useState<string[]>([
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop',
  ]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <p className="text-slate-600 font-bold">Please select a profile from the header to create an auction.</p>
      </div>
    );
  }

  const handleAddImageUrl = (url: string) => {
    setImageUrls((prev) => [...prev, url]);
  };

  const handleRemoveImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const startPrice = parseFloat(startingBid);
    if (isNaN(startPrice) || startPrice <= 0) {
      alert('Please enter a valid starting price.');
      return;
    }

    if (imageUrls.length === 0) {
      alert('Please provide at least one image URL for the auction item.');
      return;
    }

    const endTime = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

    startTransition(async () => {
      // 3. Bind auction to current authenticated user
      const res = await createAuctionAction({
        title,
        category,
        description,
        startingPrice: startPrice,
        minIncrement: 5,
        endTime,
        images: imageUrls,
        sellerId: user.id, 
        sellerName: user.name,
        sellerAvatar: user.avatar,
      });

      if (res.success) {
        // 4. Redirect straight to dashboard and refresh router cache
        router.push('/seller/dashboard');
        router.refresh();
      } else {
        alert(res.error || 'Failed to create auction.');
      }
    });
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
          durationDays={durationDays}
          setDurationDays={setDurationDays}
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