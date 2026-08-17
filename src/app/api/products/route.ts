// src/app/api/products/route.ts
import { NextResponse } from 'next/server';
import { getAllProducts } from '@/lib/products-store';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search')?.toLowerCase();
    const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : null;
    const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : null;
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 100);
    const cursor = searchParams.get('cursor'); // Base64 or plain ID cursor

    let products = await getAllProducts();

    // 1. Apply Filtering
    if (category) {
      products = products.filter((p) => p.category.toLowerCase() === category.toLowerCase());
    }
    if (search) {
      products = products.filter(
        (p) => p.title.toLowerCase().includes(search) || p.description.toLowerCase().includes(search)
      );
    }
    if (minPrice !== null) {
      products = products.filter((p) => p.price >= minPrice);
    }
    if (maxPrice !== null) {
      products = products.filter((p) => p.price <= maxPrice);
    }

    // 2. Apply Cursor-Based Pagination
    let startIndex = 0;
    if (cursor) {
      const decodedCursor = Buffer.from(cursor, 'base64').toString('utf-8');
      const foundIndex = products.findIndex((p) => p.id === decodedCursor);
      if (foundIndex !== -1) {
        startIndex = foundIndex + 1;
      }
    }

    const paginatedProducts = products.slice(startIndex, startIndex + limit);
    const lastItem = paginatedProducts[paginatedProducts.length - 1];

    const nextCursor =
      lastItem && startIndex + limit < products.length
        ? Buffer.from(lastItem.id).toString('base64')
        : null;

    return NextResponse.json({
      success: true,
      data: paginatedProducts,
      pagination: {
        limit,
        nextCursor,
        hasMore: !!nextCursor,
        totalMatching: products.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve products' },
      { status: 500 }
    );
  }
}