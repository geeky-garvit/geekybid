import Modal from '@/components/modal/Modal';
import AuctionDetailView from '@/components/auction/AuctionDetailView';

export default async function AuctionModal({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Modal>
      <AuctionDetailView auctionId={id} />
    </Modal>
  );
}
