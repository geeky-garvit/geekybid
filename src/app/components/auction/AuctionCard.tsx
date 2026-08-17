// src/components/auction/AuctionCard.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Auction } from '@/lib/store';

interface AuctionCardProps {
  auction: Auction;
}

export default function AuctionCard({ auction }: AuctionCardProps) {
  const isLive = auction.status === 'live';
  const mainImage =
    auction.images && auction.images.length > 0
      ? auction.images[0]
      : 'https://picsum.photos/seed/fallback/600/600';

  return (
    <Link
      href={`/auction/${encodeURIComponent(auction.id)}`}
      className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col h-full"
    >
      {/* Image Container */}
      <div className="relative w-full h-48 bg-slate-100 overflow-hidden">
        <Image
          src={mainImage}
          alt={auction.title}
          fill
          className="object-cover group-hover:scale-105 transition duration-300"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute top-3 left-3">
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm ${
              isLive ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-white'
            }`}
          >
            {isLive ? 'Live' : 'Ended'}
          </span>
        </div>
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-bold text-slate-800 shadow-sm">
          {auction.bidsCount} bids
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow justify-between space-y-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-purple-600 block mb-1">
            {auction.category}
          </span>
          <h3 className="font-bold text-slate-900 text-sm line-clamp-1 group-hover:text-purple-600 transition">
            {auction.title}
          </h3>
          <p className="text-xs text-slate-500 line-clamp-2 mt-1">
            {auction.description}
          </p>
        </div>

        {/* Pricing / Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-semibold text-slate-400">Current Bid</p>
            <p className="text-sm font-black text-slate-900">
              ${auction.currentHighestBid.toFixed(2)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase font-semibold text-slate-400">Seller</p>
            <div className="flex items-center gap-1.5 mt-0.5 justify-end">
              <div className="relative w-4 h-4 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                <Image
                  src={auction.sellerAvatar || 'https://picsum.photos/seed/user/100/100'}
                  alt={auction.sellerName || 'Seller'}
                  fill
                  className="object-cover"
                  sizes="16px"
                />
              </div>
              <span className="text-xs font-semibold text-slate-700 truncate max-w-[80px]">
                {auction.sellerName}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}