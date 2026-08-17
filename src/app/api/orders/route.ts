// src/app/api/orders/route.ts
import { NextResponse } from 'next/server';
import { store, Order } from '@/lib/store';

interface OrderItemInput {
  id: string; // auctionId or productId
  price: number;
  quantity: number;
  title?: string;
  image?: string;
  [key: string]: unknown;
}

export interface DetailedOrder extends Order {
  items: OrderItemInput[];
  createdAt: string;
  itemTitle?: string;
  image?: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Safe fallback in case store.orders is uninitialized
    const allOrders = store.orders || [];

    if (userId) {
      const userOrders = allOrders.filter((order) => order.winnerId === userId);
      return NextResponse.json({ orders: userOrders });
    }

    return NextResponse.json({ orders: allOrders });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, items, totalAmount } = body as {
      userId?: string;
      items?: OrderItemInput[];
      totalAmount?: number;
    };

    if (!userId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required parameters: userId and items' },
        { status: 400 }
      );
    }

    const calculatedTotal = items.reduce(
      (acc, item) => acc + (item.price || 0) * (item.quantity || 1),
      0
    );

    const primaryItemId = items[0]?.id;
    const matchingAuction = store.auctions.find((a) => a.id === primaryItemId);

    const newOrder: DetailedOrder = {
      id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      auctionId: primaryItemId || 'multi-item',
      winnerId: userId,
      amount: totalAmount !== undefined ? totalAmount : parseFloat(calculatedTotal.toFixed(2)),
      isPaid: false,
      items,
      itemTitle: matchingAuction?.title || items[0]?.title || `Auction Item #${primaryItemId}`,
      image: matchingAuction?.images?.[0] || items[0]?.image || 'https://picsum.photos/600/600',
      createdAt: new Date().toISOString(),
    };

    if (!store.orders) {
      store.orders = [];
    }

    store.orders.unshift(newOrder);

    return NextResponse.json({ success: true, order: newOrder }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create order' },
      { status: 500 }
    );
  }
}