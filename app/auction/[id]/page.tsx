import { getAuctionById } from '@/lib/data';
import AuctionDetailView from '@/components/auction/AuctionDetailView';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AuctionDetailPage({ params }: PageProps) {
  const { id } = await params;
  const auction = await getAuctionById(id);

  if (!auction) {
    notFound();
  }

  return <AuctionDetailView auction={auction} />;
}