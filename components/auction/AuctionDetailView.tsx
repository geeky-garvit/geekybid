import Link from 'next/link';
import Image from 'next/image';
import CountdownTimer from './CountdownTimer';
import OptimisticBidForm from './OptimisticBidForm';
import { Auction } from '@/lib/types/auction';
import { getAuctionById } from '@/lib/data';

interface AuctionDetailViewProps {
  auction?: Auction;
  auctionId?: string;
}

export default async function AuctionDetailView({
  auction: initialAuction,
  auctionId,
}: AuctionDetailViewProps) {
  const auction = initialAuction || (auctionId ? await getAuctionById(auctionId) : null);

  if (!auction) {
    return (
      <div className="p-8 text-center text-rose-600 font-bold">
        Auction not found.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Product Image Gallery */}
      <div className="space-y-4">
        <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/60">
          <Image
            src={auction.images[0] || 'https://picsum.photos/600/600'}
            alt={auction.title}
            fill
            className="object-contain p-4"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        </div>
      </div>

      {/* Product Details & Optimistic Bidding Form */}
      <div className="space-y-6">
        <div>
          <span className="inline-block px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            {auction.category}
          </span>
          <h1 className="text-2xl font-black text-purple-950 tracking-tight">
            {auction.title}
          </h1>
          <p className="text-slate-600 text-sm mt-2 leading-relaxed">
            {auction.description}
          </p>
        </div>

        {/* Live Timer */}
        <div className="bg-amber-50/70 border border-amber-200/60 rounded-2xl p-4 flex items-center justify-between">
          <span className="text-xs font-bold text-amber-900 uppercase tracking-wide">
            Time Remaining
          </span>
          <CountdownTimer endTime={auction.endTime} />
        </div>

        {/* Real-time Optimistic Bid Form */}
        <OptimisticBidForm
          auctionId={auction.id}
          currentHighestBid={auction.currentHighestBid}
          minIncrement={auction.minIncrement}
          bidsCount={auction.bidsCount}
          endTime={auction.endTime}
        />

        {/* Seller profile snippet */}
        <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
          <div className="relative h-10 w-10 rounded-full overflow-hidden bg-purple-100">
            <Image
              src={auction.seller.avatar}
              alt={auction.seller.name}
              fill
              className="object-cover"
            />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-800">
              {auction.seller.name}
            </div>
            <div className="text-xs text-slate-500">
              Seller Rating: ★ {auction.seller.rating}
            </div>
          </div>
          <Link
            href={`/auction/${auction.id}`}
            className="ml-auto text-xs font-bold text-purple-600 hover:text-purple-700 underline"
          >
            Full Page View →
          </Link>
        </div>
      </div>
    </div>
  );
}