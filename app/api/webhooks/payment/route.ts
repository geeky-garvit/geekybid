import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const signature = request.headers.get('x-payment-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing x-payment-signature header' }, { status: 400 });
  }

  const body = await request.json();
  const { orderId, status } = body;

  return NextResponse.json({
    received: true,
    orderId,
    status: status || 'paid',
  });
}
