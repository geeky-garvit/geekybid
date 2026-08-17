import { NextResponse } from 'next/server';
import { getAuctions, initializeStore } from '@/lib/store';

export async function GET(request: Request) {
  try {
    await initializeStore();
    const { searchParams } = new URL(request.url);

    const category = searchParams.get('category') || undefined;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;

    const rawMinPrice = searchParams.get('minPrice');
    const minPrice = rawMinPrice ? parseFloat(rawMinPrice) : undefined;

    const rawMaxPrice = searchParams.get('maxPrice');
    const maxPrice = rawMaxPrice ? parseFloat(rawMaxPrice) : undefined;

    const rawEndingWithin = searchParams.get('endingWithin');
    const endingWithin = rawEndingWithin ? parseInt(rawEndingWithin, 10) : undefined;

    const sortBy = searchParams.get('sortBy') || 'endingSoon';
    const cursor = searchParams.get('cursor') || undefined;

    const rawLimit = searchParams.get('limit');
    const limit = rawLimit ? parseInt(rawLimit, 10) : 8;

    let items = getAuctions({ category, status, search });

    if (minPrice !== undefined && !isNaN(minPrice)) {
      items = items.filter((a) => a.currentHighestBid >= minPrice);
    }
    if (maxPrice !== undefined && !isNaN(maxPrice)) {
      items = items.filter((a) => a.currentHighestBid <= maxPrice);
    }
    if (endingWithin !== undefined && !isNaN(endingWithin)) {
      const cutoffTime = Date.now() + endingWithin * 3600 * 1000;
      items = items.filter((a) => new Date(a.endTime).getTime() <= cutoffTime);
    }

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
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
