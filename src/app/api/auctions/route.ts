// app/api/auctions/route.ts
import { NextResponse } from 'next/server';
import { getAuctions } from '@/lib/store';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const category = searchParams.get('category') || undefined;
  const status = searchParams.get('status') || undefined;
  const search = searchParams.get('search') || undefined;
  const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
  const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
  const endingWithin = searchParams.get('endingWithin') ? parseInt(searchParams.get('endingWithin')!) : undefined;
  const sortBy = searchParams.get('sortBy') || 'endingSoon';
  
  const cursor = searchParams.get('cursor') || undefined;
  const limit = parseInt(searchParams.get('limit') || '8');

  // Fetch filtered list from store
  let items = getAuctions({ category, status, search });

  // Apply additional filters
  if (minPrice !== undefined) {
    items = items.filter((a) => a.currentHighestBid >= minPrice);
  }
  if (maxPrice !== undefined) {
    items = items.filter((a) => a.currentHighestBid <= maxPrice);
  }
  if (endingWithin !== undefined) {
    const cutoffTime = new Date(Date.now() + endingWithin * 3600 * 1000).getTime();
    items = items.filter((a) => new Date(a.endTime).getTime() <= cutoffTime);
  }

  // Apply sorting
  items.sort((a, b) => {
    if (sortBy === 'endingSoon') {
      return new Date(a.endTime).getTime() - new Date(b.endTime).getTime();
    }
    if (sortBy === 'priceAsc') {
      return a.currentHighestBid - b.currentHighestBid;
    }
    if (sortBy === 'priceDesc') {
      return b.currentHighestBid - a.currentHighestBid;
    }
    if (sortBy === 'mostBids') {
      return b.bidsCount - a.bidsCount;
    }
    return 0;
  });

  // Apply Cursor-based slicing
  let startIndex = 0;
  if (cursor) {
    const foundIndex = items.findIndex((i) => i.id === cursor);
    if (foundIndex !== -1) {
      startIndex = foundIndex + 1;
    }
  }

  const paginatedItems = items.slice(startIndex, startIndex + limit);
  const nextCursor =
    paginatedItems.length === limit && startIndex + limit < items.length
      ? paginatedItems[paginatedItems.length - 1].id
      : null;

  return NextResponse.json({
    items: paginatedItems,
    nextCursor,
    total: items.length,
  });
}