'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { formatCurrency } from '@/lib/utils/formatters';
import { Auction } from '@/lib/types/auction';

interface AuctionDetailViewProps {
  auctionId: string;
}

export default function AuctionDetailView({ auctionId }: AuctionDetailViewProps) {
  const [activeImage, setActiveImage] = useState(0);
  const [bidAmount, setBidAmount] = useState('');
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  // Correct URL generation using Picsum seed without literal curly braces
  const mockAuction: Auction = {
    id: auctionId,
    title: 'Vintage Cyberpunk Mechanical Keyboard',
    description: 'Rare custom mechanical keyboard with retro keycaps and RGB lighting.',
    category: 'Electronics',
    startingPrice: 150,
    currentHighestBid: 250,
    minIncrement: 10,
    bidsCount: 12,
    images: [
      `https://picsum.photos/seed/${auctionId}-1/600/600`,
      `https://picsum.photos/seed/${auctionId}-2/600/600`,
      `https://picsum.photos/seed/${auctionId}-3/600/600`,
    ],
    endTime: new Date(Date.now() + 7200000).toISOString(), // 2 hours from now
    status: 'live',
    seller: {
      id: 'seller-1',
      name: 'GeekySeller',
      avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=GeekySeller`,
      rating: 4.9,
    },
    history: [
      { id: '1', bidder: 'a***r', amount: 250, time: '2 mins ago' },
      { id: '2', bidder: 'k***n', amount: 240, time: '15 mins ago' },
      { id: '3', bidder: 'm***x', amount: 220, time: '1 hour ago' },
    ],
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const diff = new Date(mockAuction.endTime).getTime() - Date.now();
      if (diff <= 0) {
        clearInterval(timer);
      } else {
        setTimeLeft({
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / 1000 / 60) % 60),
          seconds: Math.floor((diff / 1000) % 60),
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [mockAuction.endTime]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Media Gallery */}
      <div className="lg:col-span-7 space-y-4">
        <div className="relative aspect-square w-full bg-purple-50 rounded-2xl overflow-hidden border border-purple-100 shadow-sm">
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
              className={`relative h-20 w-20 rounded-xl overflow-hidden border-2 transition-all ${
                activeImage === index ? 'border-purple-600 shadow-sm' : 'border-transparent'
              }`}
            >
              <Image src={img} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      </div>

      {/* Details & Bidding Panel */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white border border-purple-100 p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 text-purple-800">
              {mockAuction.category}
            </span>
            <div className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-100">
              ⏱️ {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
            </div>
          </div>

          <h1 className="text-2xl font-extrabold text-purple-950 tracking-tight">
            {mockAuction.title}
          </h1>

          {/* Seller Card */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <Image
              src={mockAuction.seller.avatar}
              alt={mockAuction.seller.name}
              width={36}
              height={36}
              className="rounded-full"
            />
            <div>
              <p className="text-xs font-bold text-slate-800">{mockAuction.seller.name}</p>
              <p className="text-[10px] text-slate-500">⭐ {mockAuction.seller.rating} Rating</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 p-4 bg-purple-50/50 border border-purple-100 rounded-xl">
            <div>
              <span className="text-xs text-purple-900/50 block font-medium">Highest Bid</span>
              <span className="text-2xl font-black text-emerald-600">
                {formatCurrency(mockAuction.currentHighestBid)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-purple-900/50 block font-medium">Min Next Bid</span>
              <span className="text-lg font-bold text-purple-950 block mt-1">
                {formatCurrency(mockAuction.currentHighestBid + mockAuction.minIncrement)}
              </span>
            </div>
          </div>

          <form onSubmit={(e) => e.preventDefault()} className="space-y-3 pt-2">
            <div className="relative rounded-xl shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-purple-900/40 text-sm font-medium">$</span>
              </div>
              <input
                type="number"
                min={mockAuction.currentHighestBid + mockAuction.minIncrement}
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder={`${mockAuction.currentHighestBid + mockAuction.minIncrement}`}
                className="block w-full pl-8 pr-12 py-3 border border-purple-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-colors shadow-sm"
            >
              Place Bid
            </button>
          </form>
        </div>

        {/* Masked Bid History */}
        <div className="bg-white border border-purple-100 p-6 rounded-2xl shadow-sm">
          <h3 className="text-sm font-bold text-purple-950 mb-3">Bid History</h3>
          <div className="divide-y divide-purple-50">
            {mockAuction.history.map((log) => (
              <div key={log.id} className="py-2.5 flex justify-between items-center text-sm">
                <span className="font-semibold text-purple-900/80">{log.bidder}</span>
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
