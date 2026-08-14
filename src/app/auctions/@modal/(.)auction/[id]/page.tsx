// app/auctions/@modal/(.)auction/[id]/page.tsx
import Image from 'next/image';
import Link from 'next/link';
import { getAuctionById } from '@/lib/store';
import Modal from '@/app/components/ui/Modal';
import BidForm from '@/app/components/auction/BidForm';

export const dynamic = 'force-dynamic';

export default async function QuickViewAuctionModal({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const auction = getAuctionById(id);

  if (!auction) {
    return (
      <Modal>
        <div className="p-8 text-center space-y-2">
          <h3 className="text-lg font-bold text-rose-600">Auction Listing Not Found</h3>
          <p className="text-xs text-slate-500">This auction may have been removed or does not exist.</p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start pt-2">
        {/* Left: Image & Quick Details */}
        <div className="space-y-4">
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden border bg-slate-100">
            <Image
              src={auction.images[0]}
              alt={auction.title}
              fill
              className="object-cover"
              sizes="50vw"
            />
            <div className="absolute top-3 left-3 bg-purple-900/90 text-white font-bold text-[10px] px-2.5 py-1 rounded-full backdrop-blur-sm">
              Quick View
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block">
              {auction.category}
            </span>
            <h2 className="text-lg font-black text-slate-900 leading-snug">{auction.title}</h2>
            <p className="text-xs text-slate-500 line-clamp-3 mt-1">{auction.description}</p>
          </div>

          <div className="flex items-center gap-3 pt-2 border-t">
            <div className="relative w-8 h-8 rounded-full overflow-hidden border">
              <Image src={auction.sellerAvatar} alt={auction.sellerName} fill />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">Listed by</span>
              <span className="text-xs font-bold text-slate-800">{auction.sellerName}</span>
            </div>
          </div>
        </div>

        {/* Right: Bidding Module */}
        <div className="space-y-4">
          <BidForm
            key={`modal-${auction.id}-${auction.currentHighestBid}-${auction.bidsCount}`}
            auctionId={auction.id}
            initialHighestBid={auction.currentHighestBid}
            minIncrement={auction.minIncrement}
            initialBidsCount={auction.bidsCount}
            initialHistory={auction.history}
          />

          <div className="text-center pt-2">
            <Link
              href={`/auction/${auction.id}`}
              className="text-xs font-bold text-purple-600 hover:underline"
            >
              Open Full Details Page →
            </Link>
          </div>
        </div>
      </div>
    </Modal>
  );
}