import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const res = await fetch(`https://dummyjson.com/products/${id}`);
  
  if (!res.ok) {
    return NextResponse.json({ error: 'Auction not found' }, { status: 404 });
  }

  const item = await res.json();
  
  return NextResponse.json({
    id: String(item.id),
    title: item.title,
    description: item.description,
    category: item.category,
    startingPrice: Math.round(item.price * 0.7),
    currentHighestBid: item.price,
    minIncrement: 5,
    bidsCount: 12,
    images: item.images?.length ? item.images : [`https://picsum.photos/seed/${item.id}/600/600`],
    endTime: new Date(Date.now() + 7200000).toISOString(),
    status: 'live',
    seller: {
      id: `seller-${item.id}`,
      name: `Seller_${item.id}`,
      avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=Seller_${item.id}`,
      rating: 4.8,
    },
  });
}
