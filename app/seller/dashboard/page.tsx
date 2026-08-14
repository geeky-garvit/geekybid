import Link from 'next/link';
import Image from 'next/image';
import { formatCurrency } from '@/lib/utils/formatters';

interface SellerAuction {
  id: string;
  title: string;
  category: string;
  startingPrice: number;
  currentHighestBid: number;
  bidsCount: number;
  status: 'draft' | 'live' | 'ended' | 'paid';
  image: string;
}

const mockSellerAuctions: SellerAuction[] = [
  {
    id: '1',
    title: 'Vintage Cyberpunk Mechanical Keyboard',
    category: 'Electronics',
    startingPrice: 150,
    currentHighestBid: 250,
    bidsCount: 12,
    status: 'live',
    image: 'https://picsum.photos/seed/1/200/200',
  },
  {
    id: '2',
    title: 'Retro Arcade Cabinet (Custom Art)',
    category: 'Gaming',
    startingPrice: 500,
    currentHighestBid: 820,
    bidsCount: 28,
    status: 'ended',
    image: 'https://picsum.photos/seed/2/200/200',
  },
  {
    id: '3',
    title: 'Prototype OLED Gaming Display',
    category: 'Hardware',
    startingPrice: 300,
    currentHighestBid: 300,
    bidsCount: 0,
    status: 'draft',
    image: 'https://picsum.photos/seed/3/200/200',
  },
];

export default function SellerDashboardPage() {
  return (
    <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div className="flex justify-between items-center border-b border-purple-100 pb-4">
        <div>
          <h1 className="text-3xl font-black text-purple-950 tracking-tight">Seller Studio</h1>
          <p className="text-xs text-purple-900/60">Manage your active listings, bid counts, and auction status.</p>
        </div>
        <Link
          href="/seller/create"
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-600/20 transition-all"
        >
          + Create New Auction
        </Link>
      </div>

      <div className="bg-white border border-purple-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-purple-50 bg-slate-50/50 flex justify-between items-center">
          <h2 className="text-sm font-bold text-slate-800">My Listed Auctions</h2>
          <span className="text-xs text-slate-500 font-semibold">{mockSellerAuctions.length} Total</span>
        </div>

        <div className="divide-y divide-purple-50">
          {mockSellerAuctions.map((item) => (
            <div key={item.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-purple-50/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 rounded-xl bg-purple-50 overflow-hidden flex-shrink-0 border border-purple-100">
                  <Image src={item.image} alt={item.title} fill className="object-cover" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 uppercase">
                      {item.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.status === 'live'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'ended'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item.status.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="font-bold text-purple-950 text-sm mt-1">{item.title}</h3>
                  <p className="text-xs text-slate-500">Starting: {formatCurrency(item.startingPrice)}</p>
                </div>
              </div>

              <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                <div className="text-right">
                  <span className="text-xs text-slate-400 font-semibold block">Highest Bid</span>
                  <span className="text-base font-black text-emerald-600">
                    {formatCurrency(item.currentHighestBid)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 font-semibold block">Activity</span>
                  <span className="text-xs font-bold text-slate-800 block mt-0.5">{item.bidsCount} Offers</span>
                </div>
                <Link
                  href={`/auction/${item.id}`}
                  className="px-3 py-1.5 text-xs font-bold border border-purple-200 text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                >
                  View
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
