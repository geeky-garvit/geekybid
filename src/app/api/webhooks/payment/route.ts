// app/api/webhooks/payment/route.ts
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { store } from '@/lib/store';

export async function POST(request: Request) {
  const bodyText = await request.text();
  const signature = request.headers.get('x-payment-signature');
  const secret = process.env.WEBHOOK_SECRET || 'mock_secret_123';

  // Verify HMAC signature
  const expectedSig = crypto.createHmac('sha256', secret).update(bodyText).digest('hex');

  if (signature !== expectedSig) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const payload = JSON.parse(bodyText);

  if (payload.event === 'payment.succeeded') {
    const { orderId } = payload.data;
    const order = store.orders.find((o) => o.id === orderId);

    if (order) {
      order.isPaid = true;
      const auction = store.auctions.find((a) => a.id === order.auctionId);
      if (auction) auction.status = 'paid';
    }

    return NextResponse.json({ success: true, orderId });
  }

  return NextResponse.json({ received: true });
}