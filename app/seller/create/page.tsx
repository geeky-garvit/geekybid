'use client';

import { useActionState } from 'react';
import { createAuctionAction } from '@/app/actions/seller';
import Link from 'next/link';

export default function CreateAuctionPage() {
  const [state, formAction, isPending] = useActionState(createAuctionAction, null);

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex justify-between items-center border-b border-purple-100 pb-4">
        <div>
          <h1 className="text-2xl font-black text-purple-950 tracking-tight">Create New Auction</h1>
          <p className="text-xs text-purple-900/60">List your rare tech or collectible item for bidding.</p>
        </div>
        <Link
          href="/seller/dashboard"
          className="text-xs font-bold text-purple-600 hover:text-purple-700 bg-purple-50 px-3 py-2 rounded-xl"
        >
          ← Back to Dashboard
        </Link>
      </div>

      <form action={formAction} className="bg-white border border-purple-100 rounded-2xl p-6 shadow-sm space-y-5">
        {state?.error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl">
            {state.error}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-1.5">
            Item Title *
          </label>
          <input
            type="text"
            name="title"
            required
            placeholder="e.g. Rare Vintage Mechanical Keyboard"
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-1.5">
              Category *
            </label>
            <select
              name="category"
              required
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
            >
              <option value="electronics">Electronics</option>
              <option value="gaming">Gaming</option>
              <option value="hardware">Hardware</option>
              <option value="collectibles">Collectibles</option>
              <option value="beauty">Beauty</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-1.5">
              Starting Price ($) *
            </label>
            <input
              type="number"
              name="startingPrice"
              required
              min="1"
              step="1"
              placeholder="100"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-1.5">
              Minimum Bid Increment ($)
            </label>
            <input
              type="number"
              name="minIncrement"
              defaultValue="5"
              min="1"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-1.5">
              Auction Duration (Hours)
            </label>
            <select
              name="durationHours"
              defaultValue="24"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
            >
              <option value="1">1 Hour (Quick Auction)</option>
              <option value="12">12 Hours</option>
              <option value="24">24 Hours (1 Day)</option>
              <option value="72">72 Hours (3 Days)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-1.5">
            Description *
          </label>
          <textarea
            name="description"
            rows={4}
            required
            placeholder="Provide detailed specifications, condition, and origin..."
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
          ></textarea>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-purple-600/20 disabled:opacity-50"
        >
          {isPending ? 'Publishing Auction...' : 'Publish Auction'}
        </button>
      </form>
    </main>
  );
}
