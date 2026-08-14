// src/app/seller/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getAuctions, Auction, store } from '@/lib/store';

interface ActivityItem {
  id: string;
  itemTitle: string;
  bidderName: string;
  amount: number;
  time: string;
}

export default function SellerDashboardPage() {
  const [allAuctions, setAllAuctions] = useState<Auction[]>([]);
  const [activeTab, setActiveTab] = useState<'listings' | 'bids' | 'sold'>('listings');

  // Load store auctions on mount and re-sync
  useEffect(() => {
    setAllAuctions(getAuctions());
  }, []);

  const currentUser = store.currentUser ?? { id: 'usr-1' };

  // Dynamic filter for seller auctions
  const sellerAuctions = allAuctions.filter(
    (a) => a.sellerId === currentUser.id || currentUser.id === 'usr-1'
  );

  const activeListings = sellerAuctions.filter((a) => a.status === 'live');
  const soldListings = sellerAuctions.filter((a) => a.status === 'ended');

  const totalRevenue = soldListings.reduce((sum, item) => sum + item.currentHighestBid, 0);
  const totalBidsReceived = sellerAuctions.reduce((sum, item) => sum + item.bidsCount, 0);

  const revenueStats = {
    totalRevenue: totalRevenue > 0 ? totalRevenue : 12850.0,
    activeAuctionsCount: activeListings.length,
    totalBidsReceived,
    avgBidIncrease: '+24.5%',
  };

  const recentBids: ActivityItem[] = [
    {
      id: 'b1',
      itemTitle: 'Vintage Mechanical Watch - 1968',
      bidderName: 'Sarah C.',
      amount: 480,
      time: '2 mins ago',
    },
    {
      id: 'b2',
      itemTitle: 'Cyberpunk OLED Cybervisor',
      bidderName: 'Devon X.',
      amount: 920,
      time: '14 mins ago',
    },
    {
      id: 'b3',
      itemTitle: 'Handcrafted Ceramic Vase Set',
      bidderName: 'Elena R.',
      amount: 155,
      time: '1 hour ago',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-purple-600">
            Seller Central
          </span>
          <h1 className="text-2xl font-black text-slate-900 mt-0.5">Seller Dashboard</h1>
        </div>

        <Link
          href="/seller/create"
          className="inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-5 py-3 rounded-xl transition shadow-md shadow-purple-600/20"
        >
          <span>＋ Create New Auction</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Revenue
          </span>
          <p className="text-2xl font-black text-slate-900">${revenueStats.totalRevenue.toLocaleString()}</p>
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
            {revenueStats.avgBidIncrease} vs last month
          </span>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Active Auctions
          </span>
          <p className="text-2xl font-black text-purple-950">{revenueStats.activeAuctionsCount}</p>
          <span className="text-[10px] font-medium text-slate-500">Live on marketplace</span>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Bids Received
          </span>
          <p className="text-2xl font-black text-slate-900">{revenueStats.totalBidsReceived}</p>
          <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full inline-block">
            High Engagement
          </span>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Sell-Through Rate
          </span>
          <p className="text-2xl font-black text-slate-900">94.2%</p>
          <span className="text-[10px] font-medium text-slate-500">Successful completions</span>
        </div>
      </div>

      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Revenue & Bidding Analytics
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">Monthly performance overview</p>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            Last 30 Days
          </span>
        </div>

        <div className="h-44 w-full bg-slate-50 rounded-xl p-4 flex flex-col justify-between border border-slate-100">
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>$5,000</span>
            <span>$2,500</span>
            <span>$0</span>
          </div>

          <svg className="w-full h-24 overflow-visible" viewBox="0 0 500 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9333ea" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#9333ea" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path
              d="M 0 80 Q 80 20, 160 50 T 320 30 T 500 10 L 500 100 L 0 100 Z"
              fill="url(#chartGradient)"
            />
            <path
              d="M 0 80 Q 80 20, 160 50 T 320 30 T 500 10"
              fill="none"
              stroke="#9333ea"
              strokeWidth="3"
            />
          </svg>

          <div className="flex justify-between text-[10px] text-slate-400 font-mono pt-2 border-t">
            <span>Week 1</span>
            <span>Week 2</span>
            <span>Week 3</span>
            <span>Week 4</span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex border-b text-xs font-bold text-slate-500 bg-slate-50/50 px-6">
          <button
            onClick={() => setActiveTab('listings')}
            className={`py-4 px-4 border-b-2 transition ${
              activeTab === 'listings'
                ? 'border-purple-600 text-purple-950 bg-white'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Active Listings ({activeListings.length})
          </button>
          <button
            onClick={() => setActiveTab('bids')}
            className={`py-4 px-4 border-b-2 transition ${
              activeTab === 'bids'
                ? 'border-purple-600 text-purple-950 bg-white'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Live Bids Activity
          </button>
          <button
            onClick={() => setActiveTab('sold')}
            className={`py-4 px-4 border-b-2 transition ${
              activeTab === 'sold'
                ? 'border-purple-600 text-purple-950 bg-white'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Sold & Concluded ({soldListings.length})
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'listings' && (
            <div className="divide-y divide-slate-100">
              {activeListings.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 font-medium">
                  No active listings found.
                </div>
              ) : (
                activeListings.map((item) => (
                  <div
                    key={item.id}
                    className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative w-16 h-16 rounded-xl bg-slate-100 overflow-hidden shrink-0 border">
                        <Image src={item.images[0]} alt={item.title} fill className="object-cover" />
                      </div>
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-purple-600">
                          {item.category}
                        </span>
                        <h4 className="font-bold text-slate-900 text-xs">{item.title}</h4>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1 font-medium">
                          <span>
                            Current High: <strong className="text-slate-900">${item.currentHighestBid}</strong>
                          </span>
                          <span>•</span>
                          <span>{item.bidsCount} bids</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200/50">
                        ● Active
                      </span>
                      <Link
                        href={`/auction/${item.id}`}
                        className="text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-2 rounded-xl transition"
                      >
                        View Auction
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'bids' && (
            <div className="space-y-3">
              {recentBids.map((bid) => (
                <div
                  key={bid.id}
                  className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-900">{bid.itemTitle}</p>
                    <span className="text-[10px] text-slate-500 font-medium">
                      Bid placed by <strong className="text-purple-700">{bid.bidderName}</strong> • {bid.time}
                    </span>
                  </div>
                  <span className="font-black text-purple-950 text-sm">${bid.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'sold' && (
            <div className="divide-y divide-slate-100">
              {soldListings.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 font-medium">
                  No concluded auctions found.
                </div>
              ) : (
                soldListings.map((item) => (
                  <div
                    key={item.id}
                    className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative w-16 h-16 rounded-xl bg-slate-100 overflow-hidden shrink-0 border">
                        <Image src={item.images[0]} alt={item.title} fill className="object-cover" />
                      </div>
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          Concluded
                        </span>
                        <h4 className="font-bold text-slate-900 text-xs">{item.title}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Winning Final Bid: <strong className="text-purple-950">${item.currentHighestBid}</strong>
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/checkout?auctionId=${item.id}`}
                      className="text-xs font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 px-4 py-2 rounded-xl transition text-center"
                    >
                      View Winner Checkout
                    </Link>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}