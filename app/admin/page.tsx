import Link from 'next/link';
import Image from 'next/image';
import { getAllAuctions } from '@/lib/data';

export default async function AdminDashboardPage() {
  // Pull all ~500 items from DummyJSON + Faker generator
  const allAuctions = await getAllAuctions();
  
  // Stats calculations
  const stats = {
    totalAuctions: allAuctions.length,
    activeBids: allAuctions.reduce((acc, curr) => acc + curr.bidsCount, 0),
    revenue: allAuctions.reduce((acc, curr) => acc + curr.currentHighestBid, 0),
    totalSellers: new Set(allAuctions.map((a) => a.seller.id)).size,
  };

  // Only show first 50 items in the admin table to save rendering memory
  const displayAuctions = allAuctions.slice(0, 50);

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-purple-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-600 text-white">
              System Admin
            </span>
            <h1 className="text-3xl font-black text-purple-950 tracking-tight">GeekyBid Oversight</h1>
          </div>
          <p className="text-xs text-purple-900/60 mt-1">Manage global listings, platform revenue, and seller compliance.</p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-sm space-y-1">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Listings</p>
          <p className="text-2xl font-black text-purple-950">{stats.totalAuctions}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-sm space-y-1">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Bids Placed</p>
          <p className="text-2xl font-black text-purple-950">{stats.activeBids.toLocaleString()}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-sm space-y-1">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">GMV Volume</p>
          <p className="text-2xl font-black text-purple-600">${stats.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-sm space-y-1">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Sellers</p>
          <p className="text-2xl font-black text-purple-950">{stats.totalSellers}</p>
        </div>
      </div>

      {/* Management Table */}
      <div className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-purple-100 flex items-center justify-between">
          <h2 className="text-base font-black text-purple-950">System Auctions (Showing 50 of {stats.totalAuctions})</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-purple-50/50 text-[11px] uppercase tracking-wider text-purple-900/70 font-black border-b border-purple-100">
                <th className="py-3 px-6">Auction Item</th>
                <th className="py-3 px-4">Seller</th>
                <th className="py-3 px-4">Highest Bid</th>
                <th className="py-3 px-4">Bids</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-50 text-xs">
              {displayAuctions.map((auction) => (
                <tr key={auction.id} className="hover:bg-purple-50/30 transition-colors">
                  <td className="py-3 px-6">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                        <Image src={auction.images[0]} alt={auction.title} fill className="object-cover" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 truncate max-w-[200px] sm:max-w-xs">{auction.title}</p>
                        <p className="text-[10px] text-slate-500 capitalize">{auction.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <img src={auction.seller.avatar} alt={auction.seller.name} className="w-5 h-5 rounded-full bg-slate-100" />
                      <span className="font-semibold text-slate-700">{auction.seller.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-black text-purple-900">${auction.currentHighestBid}</td>
                  <td className="py-3 px-4 font-bold text-slate-600">{auction.bidsCount}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${auction.status === 'live' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>{auction.status}</span>
                  </td>
                  <td className="py-3 px-6 text-right">
                    <Link href={`/auction/${auction.id}`} className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-[11px] font-bold transition-all">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
