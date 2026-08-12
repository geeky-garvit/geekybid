import { getAuctionById } from '@/lib/data';
import AuctionDetailView from '@/components/auction/AuctionDetailView';
import { notFound } from 'next/navigation';

interface ModalProps {
  params: Promise<{ id: string }>;
}

export default async function AuctionModal({ params }: ModalProps) {
  const { id } = await params;
  const auction = await getAuctionById(id);

  if (!auction) {
    notFound();
  }

  return <AuctionDetailView auction={auction} />;
}