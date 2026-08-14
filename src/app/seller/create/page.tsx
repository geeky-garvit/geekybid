// src/app/seller/create/page.tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { store } from '@/lib/store';
import { createAuctionAction } from '@/app/actions/auction';

const CATEGORIES = ['electronics', 'art', 'collectibles', 'fashion', 'jewelry'];

export default function CreateAuctionPage() {
  const router = useRouter();
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
  const [customImageUrl, setCustomImageUrl] = useState('');

  const handleAddImageUrl = () => {
    if (!customImageUrl.trim()) return;
    setImageUrls([...imageUrls, customImageUrl.trim()]);
    setCustomImageUrl('');
  };

  const handleRemoveImage = (index: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
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

    const currentUser = store.currentUser ?? {
      id: 'usr-1',
      name: 'Alex Johnson',
      avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Alex',
    };

    startTransition(async () => {
      await createAuctionAction({
        title,
        category,
        description,
        startingPrice: startPrice,
        minIncrement: 5,
        endTime,
        images: imageUrls,
        sellerId: currentUser.id,
        sellerName: currentUser.name,
        sellerAvatar: currentUser.avatar,
      });

      alert('🎉 Auction listed successfully!');
      router.push('/auctions');
      router.refresh();
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-purple-600">
            Seller Portal
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
        <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
            1. Item Details
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Auction Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Rare Vintage Chronograph Watch (1972)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-purple-600 capitalize bg-white"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Auction Duration *
                </label>
                <select
                  value={durationDays}
                  onChange={(e) => setDurationDays(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-purple-600 bg-white"
                >
                  <option value={1}>1 Day (Express)</option>
                  <option value={3}>3 Days (Recommended)</option>
                  <option value={5}>5 Days</option>
                  <option value={7}>7 Days (1 Week)</option>
                  <option value={14}>14 Days (Extended)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Item Description *
              </label>
              <textarea
                required
                rows={4}
                placeholder="Describe condition, history, authenticity, and key features..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
            2. Pricing & Reserve
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Starting Price ($ USD) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">$</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="50.00"
                  value={startingBid}
                  onChange={(e) => setStartingBid(e.target.value)}
                  className="w-full pl-7 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Reserve Price ($ USD) <span className="font-normal text-slate-400">(Optional)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">$</span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="200.00"
                  value={reservePrice}
                  onChange={(e) => setReservePrice(e.target.value)}
                  className="w-full pl-7 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Minimum price required for the auction to sell. Hidden from bidders.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
            3. Product Images
          </h3>

          <div className="flex gap-2">
            <input
              type="url"
              placeholder="Paste image URL (e.g., Unsplash image address)"
              value={customImageUrl}
              onChange={(e) => setCustomImageUrl(e.target.value)}
              className="flex-1 p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-600"
            />
            <button
              type="button"
              onClick={handleAddImageUrl}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition"
            >
              Add URL
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {imageUrls.map((url, idx) => (
              <div
                key={idx}
                className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 border group"
              >
                <Image src={url} alt={`Preview ${idx + 1}`} fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute top-1.5 right-1.5 bg-rose-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition shadow"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

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