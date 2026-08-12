import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const limit = Number(searchParams.get('limit')) || 10;
  const cursor = Number(searchParams.get('cursor')) || 0;

  const res = await fetch(`https://dummyjson.com/products?limit=${limit}&skip=${cursor}`);
  const data = await res.json();

  let products = data.products;
  if (category && category !== 'all') {
    products = products.filter((p: any) => p.category.toLowerCase() === category.toLowerCase());
  }

  const auctions = products.map((item: any) => ({
    id: String(item.id),
    title: item.title,
    description: item.description,
    category: item.category,
    startingPrice: Math.round(item.price * 0.7),
    currentHighestBid: item.price,
    minIncrement: 5,
    bidsCount: Math.floor(Math.random() * 20) + 1,
    images: item.images?.length ? item.images : [`https://picsum.photos/seed/${item.id}/600/600`],
    endTime: new Date(Date.now() + 3600000).toISOString(),
    status: 'live',
  }));

  const nextCursor = cursor + limit < data.total ? cursor + limit : null;

  return NextResponse.json({
    auctions,
    nextCursor,
    total: data.total,
  });
}
