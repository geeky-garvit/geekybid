'use client';

import { useState } from 'react';
import Image from 'next/image';
import { formatCurrency } from '@/lib/utils/formatters';

interface AuctionDetailViewProps {
  auctionId: string;
}

export default function AuctionDetailView({ auctionId }: AuctionDetailViewProps) {
  const [activeImage, setActiveImage] = useState(0);
  const [bidAmount, setBidAmount] = useState('');

  // Fixed template literal interpolation: ${auctionId} instead of {safeId}
  const mockAuction = {
    id: auctionId,
    title: 'Vintage Cyberpunk Mechanical Keyboard',
    category: 'Electronics',
    currentHighestBid: 250,
    bidsCount: 12,
    images: [
      `https://picsum.photos/seed/${auctionId}-1/800/600`,
      `https://picsum.photos/seed/${auctionId}-2/800/600`,
      `https://picsum.photos/seed/${auctionId}-3/800/600`,
    ],
    history: [
      { id: '1', bidder: 'User_492', amount: 250, time: '2 mins ago' },
      { id: '2', bidder: 'CyberCollector', amount: 240, time: '15 mins ago' },
    ],
  };

  const handlePlaceBid = (e: React.FormEvent) => {
    e.preventDefault();
    setBidAmount('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Media Gallery */}
      <div className="lg:col-span-7 space-y-4">
        <div className="relative aspect-video w-full bg-purple-50 rounded-2xl overflow-hidden border border-purple-100 shadow-sm">
          <Image
            src={mockAuction.images[activeImage]}
            alt={mockAuction.title}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 58vw"
            className="object-cover"
          />
        </div>

        {/* Thumbnails */}
        <div className="flex gap-3">
          {mockAuction.images.map((img, index) => (
            <button
              key={index}
              onClick={() => setActiveImage(index)}
              className={`relative h-20 w-28 rounded-xl overflow-hidden border-2 transition-all ${
                activeImage === index ? 'border-purple-600 shadow-sm' : 'border-transparent'
              }`}
            >
              <Image 
                src={img} 
                alt="" 
                fill 
                sizes="112px" 
                className="object-cover" 
              />
            </button>
          ))}
        </div>
      </div>

      {/* Details & Bidding Panel */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white border border-purple-100 p-6 rounded-2xl shadow-sm">
          <div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
              {mockAuction.category}
            </span>
            <h1 className="text-2xl font-extrabold text-purple-950 tracking-tight mt-2">
              {mockAuction.title}
            </h1>
          </div>

          <div className="grid grid-cols-2 gap-4 p-4 bg-purple-50/50 border border-purple-100 rounded-xl mt-4">
            <div>
              <span className="text-xs text-purple-900/50 block font-medium">Current Bid</span>
              <span className="text-2xl font-black text-emerald-600">
                {formatCurrency(mockAuction.currentHighestBid)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-purple-900/50 block font-medium">Activity</span>
              <span className="text-lg font-bold text-purple-950 block mt-1">
                {mockAuction.bidsCount} Offers
              </span>
            </div>
          </div>

          <form onSubmit={handlePlaceBid} className="space-y-3 pt-4">
            <label className="text-xs font-bold text-purple-950 block">Place Your Bid</label>
            <div className="relative rounded-xl shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-purple-900/40 text-sm font-medium">$</span>
              </div>
              <input
                type="number"
                required
                min={mockAuction.currentHighestBid + 1}
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder={(mockAuction.currentHighestBid + 5).toFixed(2)}
                className="block w-full pl-8 pr-12 py-3 border border-purple-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-colors"
            >
              Confirm and Bid
            </button>
          </form>
        </div>

        {/* Activity Log */}
        <div className="bg-white border border-purple-100 p-6 rounded-2xl shadow-sm">
          <h3 className="text-sm font-bold text-purple-950 mb-3">Recent Activity Log</h3>
          <div className="divide-y divide-purple-50">
            {mockAuction.history.map((log) => (
              <div key={log.id} className="py-2.5 flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-purple-400"></div>
                  <span className="font-semibold text-purple-900/80">{log.bidder}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-purple-950 block">{formatCurrency(log.amount)}</span>
                  <span className="text-[10px] text-purple-900/40 block">{log.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
