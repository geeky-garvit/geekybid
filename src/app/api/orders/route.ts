import { NextResponse } from 'next/server';
import { store, Order } from '@/lib/store';
import { getCurrentUser } from '@/lib/auth';

interface OrderItemInput {
  id: string;
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

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    return NextResponse.json({
      orders: store.orders.filter((order) => order.winnerId === currentUser.id),
    });
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
    const { items } = body as {
      items?: OrderItemInput[];
    };

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required parameter: items' },
        { status: 400 }
      );
    }

    const primaryItemId = items[0]?.id;
    const matchingAuction = store.auctions.find((a) => a.id === primaryItemId);
    if (!matchingAuction) {
      return NextResponse.json({ error: 'Auction not found' }, { status: 404 });
    }
    if (matchingAuction.status !== 'ended' || matchingAuction.history[0]?.bidderId !== currentUser.id) {
      return NextResponse.json({ error: 'Only the auction winner can create an order' }, { status: 403 });
    }
    if (store.orders.some((order) => order.auctionId === primaryItemId)) {
      return NextResponse.json({ error: 'An order already exists for this auction' }, { status: 409 });
    }
    const amount = Math.round((matchingAuction.currentHighestBid * 1.08 + 15) * 100) / 100;

    const newOrder: DetailedOrder = {
      id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      auctionId: primaryItemId || 'multi-item',
      winnerId: currentUser.id,
      amount,
      isPaid: false,
      items,
      itemTitle: matchingAuction.title,
      image: matchingAuction.images[0] || 'https://picsum.photos/600/600',
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
