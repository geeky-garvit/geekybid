import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { initializeStore, placeBid } from '@/lib/store';

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  let payload: { auctionId?: unknown; amount?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (typeof payload.auctionId !== 'string' || !payload.auctionId.trim()) {
    return NextResponse.json({ error: 'auctionId is required' }, { status: 400 });
  }
  if (typeof payload.amount !== 'number' || !Number.isFinite(payload.amount) || payload.amount <= 0) {
    return NextResponse.json({ error: 'amount must be a positive number' }, { status: 400 });
  }

  await initializeStore();
  try {
    const auction = placeBid(payload.auctionId, payload.amount, currentUser.id, currentUser.name);
    return NextResponse.json({ auction }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to place bid' },
      { status: 400 }
    );
  }
}
