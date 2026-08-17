'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

interface AuctionFilterProps {
  search: string;
  category: string;
  status: string;
  minPrice?: number;
  maxPrice?: number;
  endingWithin?: number;
  sortBy: string;
}

export default function AuctionHorizontalFilter({
  search,
  category,
  status,
  minPrice,
  maxPrice,
  endingWithin,
  sortBy,
}: AuctionFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Local form states
  const [searchValue, setSearchValue] = useState(search);
  const [categoryValue, setCategoryValue] = useState(category);
  const [statusValue, setStatusValue] = useState(status);
  const [minPriceValue, setMinPriceValue] = useState<string>(minPrice?.toString() || '');
  const [maxPriceValue, setMaxPriceValue] = useState<string>(maxPrice?.toString() || '');
  const [endingWithinValue, setEndingWithinValue] = useState<string>(
    endingWithin?.toString() || ''
  );
  const [sortByValue, setSortByValue] = useState(sortBy);

  // Sync state whenever URL parameters change (handles back/forward browser buttons)
  useEffect(() => {
    setSearchValue(searchParams.get('search') || '');
    setCategoryValue(searchParams.get('category') || 'all');
    setStatusValue(searchParams.get('status') || 'live');
    setMinPriceValue(searchParams.get('minPrice') || '');
    setMaxPriceValue(searchParams.get('maxPrice') || '');
    setEndingWithinValue(searchParams.get('endingWithin') || '');
    setSortByValue(searchParams.get('sortBy') || 'endingSoon');
  }, [searchParams]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const params = new URLSearchParams();

    if (searchValue.trim()) params.set('search', searchValue.trim());
    if (categoryValue && categoryValue !== 'all') params.set('category', categoryValue);
    if (statusValue && statusValue !== 'live') params.set('status', statusValue);
    if (minPriceValue) params.set('minPrice', minPriceValue);
    if (maxPriceValue) params.set('maxPrice', maxPriceValue);
    if (endingWithinValue) params.set('endingWithin', endingWithinValue);
    if (sortByValue && sortByValue !== 'endingSoon') params.set('sortBy', sortByValue);

    const queryString = params.toString();
    router.push(queryString ? `/auctions?${queryString}` : '/auctions');
  };

  // Count active non-default filters for UI feedback
  const activeFilterCount = [
    searchValue.trim() !== '',
    categoryValue !== 'all',
    statusValue !== 'live',
    minPriceValue !== '',
    maxPriceValue !== '',
    endingWithinValue !== '',
    sortByValue !== 'endingSoon',
  ].filter(Boolean).length;

  return (
    <div className="w-full bg-white border border-slate-200/80 rounded-2xl p-4 md:p-5 shadow-sm space-y-4 h-[50vh] ">
      {/* Top Header Row */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-purple-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          <h2 className="font-bold text-slate-900 text-sm tracking-tight">Filter & Sort</h2>
          {activeFilterCount > 0 && (
            <span className="bg-purple-100 text-purple-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
              {activeFilterCount} active
            </span>
          )}
        </div>

        <Link
          href="/auctions"
          className="text-xs font-bold text-purple-600 hover:text-purple-700 transition"
        >
          Reset All
        </Link>
      </div>

      {/* Horizontal Form Grid */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
        {/* Search */}
        <div className="lg:col-span-2">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Search
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search keyword..."
              className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 outline-none transition"
            />
            {searchValue && (
              <button
                type="button"
                onClick={() => setSearchValue('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Category
          </label>
          <select
            value={categoryValue}
            onChange={(e) => setCategoryValue(e.target.value)}
            className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 outline-none transition"
          >
            <option value="all">All Categories</option>
            <option value="electronics">Electronics</option>
            <option value="photography">Photography</option>
            <option value="collectibles">Collectibles</option>
            <option value="art">Art</option>
            <option value="fashion">Fashion</option>
            <option value="jewelry">Jewelry</option>
            <option value="general">General</option>
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Status
          </label>
          <select
            value={statusValue}
            onChange={(e) => setStatusValue(e.target.value)}
            className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 outline-none transition"
          >
            <option value="live">● Live</option>
            <option value="ended">Ended</option>
            <option value="all">All</option>
          </select>
        </div>

        {/* Price Range ($ Min - Max) */}
        

        {/* Ending Within */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Ending Within
          </label>
          <select
            value={endingWithinValue}
            onChange={(e) => setEndingWithinValue(e.target.value)}
            className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 outline-none transition"
          >
            <option value="">Anytime</option>
            <option value="1">⏱ Within 1 Hr</option>
            <option value="6">⏱ Within 6 Hrs</option>
            <option value="24">⏱ Within 24 Hrs</option>
          </select>
        </div>

        {/* Sort Order */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Sort Order
          </label>
          <select
            value={sortByValue}
            onChange={(e) => setSortByValue(e.target.value)}
            className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 outline-none transition"
          >
            <option value="endingSoon">Ending Soonest</option>
            <option value="mostBids">Most Bids (Hot)</option>
            <option value="priceAsc">Price: Low to High</option>
            <option value="priceDesc">Price: High to Low</option>
          </select>
        </div>

        {/* Submit Action */}
        <div className="lg:col-span-2">
          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 active:scale-[0.99] text-white font-bold py-2 rounded-xl text-xs transition shadow-sm shadow-purple-600/20"
          >
            Apply Filters
          </button>
        </div>
      </form>
    </div>
  );
}