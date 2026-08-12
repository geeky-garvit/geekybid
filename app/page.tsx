import AuctionCard from '@/components/auction/AuctionCard';
import { Auction } from '@/lib/types/auction';

const mockAuctions: Auction[] = [
  {
    id: '1',
    title: 'Vintage Cyberpunk Mechanical Keyboard',
    category: 'Electronics',
    currentHighestBid: 250,
    bidsCount: 12,
    images: ['https://picsum.photos/seed/1-1/800/600'],
    history: [],
  },
  {
    id: '2',
    title: 'Retro Arcade Cabinet (Custom Art)',
    category: 'Gaming',
    currentHighestBid: 820,
    bidsCount: 28,
    images: ['https://picsum.photos/seed/2-1/800/600'],
    history: [],
  },
  {
    id: '3',
    title: 'Limited Edition Holographic Graphic Card',
    category: 'Hardware',
    currentHighestBid: 610,
    bidsCount: 19,
    images: ['https://picsum.photos/seed/3-1/800/600'],
    history: [],
  },
];

export default function HomePage() {
  return (
    <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-black text-purple-950 tracking-tight">
          Live Bids & Auctions
        </h1>
        <p className="text-purple-900/60 text-sm">
          Explore rare tech, collectibles, and geek gear up for auction.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockAuctions.map((auction) => (
          <AuctionCard key={auction.id} auction={auction} />
        ))}
      </section>
    </main>
  );
}
