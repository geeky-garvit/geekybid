import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: auctionId } = await params;
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    const viewer = await prisma.auctionViewer.upsert({
      where: {
        auctionId_sessionId: {
          auctionId,
          sessionId,
        },
      },
      update: {
        lastSeen: new Date(),
      },
      create: {
        auctionId,
        sessionId,
      },
    });

    return NextResponse.json({ success: true, viewer });
  } catch (error) {
    console.error('Error registering viewer:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to register viewer' },
      { status: 500 }
    );
  }
}
