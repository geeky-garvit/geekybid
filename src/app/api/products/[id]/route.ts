// src/app/api/products/[id]/route.ts
import { NextResponse } from 'next/server';
import { getAllProducts, Product } from '@/lib/products-store';

export async function GET(
  _request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const products: Product[] = await getAllProducts();
    const product = products.find((p: Product) => p.id === params.id);

    if (!product) {
      return NextResponse.json(
        { success: false, message: `Product with ID '${params.id}' not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}