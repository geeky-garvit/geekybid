// src/app/seller/edit/[id]/page.tsx
'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAuctions } from '@/lib/store';

export default function EditAuctionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const auction = getAuctions().find((item) => item.id === id);

  const [title, setTitle] = useState(auction?.title || '');
  const [category, setCategory] = useState(auction?.category || 'electronics');
  const [description, setDescription] = useState(auction?.description || '');

  if (!auction) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center space-y-4">
        <h2 className="text-lg font-bold text-slate-800">Auction listing not found</h2>
        <Link href="/seller/dashboard" className="text-xs font-bold text-purple-600 hover:underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const isLocked = auction.bidsCount > 0;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) {
      alert('🔒 Editing is locked because bids have already been placed.');
      return;
    }

    alert('Listing updated successfully!');
    router.push('/seller/dashboard');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-black text-slate-900">Edit Auction</h1>
          <p className="text-xs text-slate-500 mt-0.5">ID: {auction.id}</p>
        </div>
        <Link
          href="/seller/dashboard"
          className="text-xs font-bold text-slate-500 hover:text-slate-800 transition"
        >
          Cancel
        </Link>
      </div>

      {/* Lock Notice Header */}
      {isLocked && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3 shadow-sm">
          <span className="text-xl shrink-0">🔒</span>
          <div>
            <h4 className="text-xs font-bold text-amber-900">Editing Locked</h4>
            <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
              This auction has already received {auction.bidsCount} bid(s). To protect bidder trust, starting price and basic details cannot be modified.
            </p>
          </div>
        </div>
      )}

      {/* Main Edit Form */}
      <form onSubmit={handleSave} className="bg-white border border-slate-200 p-6 rounded-2xl space-y-5 shadow-sm">
        {/* Title */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Item Title</label>
          <input
            type="text"
            disabled={isLocked}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`w-full p-2.5 border rounded-xl text-xs font-medium outline-none transition ${
              isLocked
                ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                : 'border-slate-200 focus:ring-2 focus:ring-purple-600'
            }`}
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
          <select
            disabled={isLocked}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={`w-full p-2.5 border rounded-xl text-xs font-medium outline-none capitalize transition ${
              isLocked
                ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                : 'border-slate-200 focus:ring-2 focus:ring-purple-600 bg-white'
            }`}
          >
            <option value="electronics">Electronics</option>
            <option value="photography">Photography</option>
            <option value="collectibles">Collectibles</option>
            <option value="general">General</option>
          </select>
        </div>

        {/* Starting Price / Bidding Snapshot (Read-only) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Current Highest Bid</label>
          <input
            type="text"
            disabled
            value={`$${auction.currentHighestBid.toFixed(2)} (${auction.bidsCount} bids)`}
            className="w-full p-2.5 border border-slate-200 bg-slate-100 text-slate-500 rounded-xl text-xs font-bold cursor-not-allowed"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
          <textarea
            rows={4}
            disabled={isLocked}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`w-full p-2.5 border rounded-xl text-xs font-medium outline-none transition ${
              isLocked
                ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                : 'border-slate-200 focus:ring-2 focus:ring-purple-600'
            }`}
          />
        </div>

        {/* Submit Action */}
        <button
          type="submit"
          disabled={isLocked}
          className={`w-full font-bold py-3 rounded-xl text-xs transition shadow-sm ${
            isLocked
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/20'
          }`}
        >
          {isLocked ? 'Listing Locked' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}