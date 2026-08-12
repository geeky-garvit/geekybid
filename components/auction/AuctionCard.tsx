'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Auction } from '@/lib/types/auction';
import { formatCurrency } from '@/lib/utils/formatters';

interface AuctionCardProps {
  auction: Auction;
}

export default function AuctionCard({ auction }: AuctionCardProps) {
  return (
    <Link 
      href={`/auction/${auction.id}`} 
      className="group bg-white border border-purple-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col"
    >
      <div className="relative aspect-video w-full bg-purple-50 overflow-hidden">
        <Image
          src={auction.images[0]}
          alt={auction.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <span className="absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-purple-900 shadow-sm">
          {auction.category}
        </span>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <h2 className="text-lg font-bold text-purple-950 group-hover:text-purple-600 transition-colors line-clamp-1">
            {auction.title}
          </h2>
        </div>

        <div className="flex justify-between items-end pt-3 border-t border-purple-50">
          <div>
            <span className="text-xs text-purple-900/50 block font-medium">Highest Bid</span>
            <span className="text-xl font-black text-emerald-600">
              {formatCurrency(auction.currentHighestBid)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs text-purple-900/50 block font-medium">Activity</span>
            <span className="text-sm font-bold text-purple-950">
              {auction.bidsCount} Bids
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
