import AuctionDetailView from '@/components/auction/AuctionDetailView';

export default async function AuctionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <AuctionDetailView auctionId={id} />
    </main>
  );
}
