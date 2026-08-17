// src/app/api/webhooks/payment/route.ts
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { store } from '@/lib/store';

interface PaymentWebhookPayload {
  event: string;
  data: {
    orderId: string;
    [key: string]: unknown;
  };
}

export async function POST(request: Request) {
  try {
    const bodyText = await request.text();
    const signature = request.headers.get('x-payment-signature');
    const secret = process.env.WEBHOOK_SECRET || 'mock_secret_123';

    if (!signature) {
      return NextResponse.json({ error: 'Missing x-payment-signature header' }, { status: 401 });
    }

    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(bodyText)
      .digest('hex');

    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSig);

    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
      return NextResponse.json({ error: 'Invalid HMAC signature' }, { status: 401 });
    }

    const payload = JSON.parse(bodyText) as PaymentWebhookPayload;

    if (payload.event === 'payment.succeeded') {
      const { orderId } = payload.data;
      const order = store.orders?.find((item) => item.id === orderId);

      if (!order) {
        return NextResponse.json({ error: `Order ${orderId} not found` }, { status: 404 });
      }

      order.isPaid = true;
      const auction = store.auctions.find((item) => item.id === order.auctionId);
      if (auction) {
        auction.status = 'ended'; // or 'paid' based on your store types
      }

      return NextResponse.json({ success: true, orderId });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}