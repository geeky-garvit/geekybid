import { prisma } from '@/lib/prisma';

/**
 * Checks for ACTIVE auctions past their endTime, finds the highest bidder,
 * sets status to 'ENDED', and records highestBidderId.
 */
export async function closeExpiredAuctionsAndFindWinners() {
  const now = new Date();

  const expiredAuctions = await prisma.auction.findMany({
    where: {
      status: 'ACTIVE',
      endTime: { lte: now },
    },
    include: {
      bids: {
        orderBy: { amount: 'desc' },
        take: 1,
      },
    },
  });

  for (const auction of expiredAuctions) {
    const highestBid = auction.bids[0];

    if (highestBid) {
      await prisma.auction.update({
        where: { id: auction.id },
        data: {
          status: 'ENDED',
          highestBidderId: highestBid.userId,
        },
      });

      // Optional: Log activity for the winning user
      await prisma.activity.create({
        data: {
          action: 'AUCTION_WON',
          details: `Won auction "${auction.title}"`,
          amount: highestBid.amount,
          userId: highestBid.userId,
        },
      });
    } else {
      // No bids received
      await prisma.auction.update({
        where: { id: auction.id },
        data: { status: 'ENDED' },
      });
    }
  }
}

/** Get all auctions for the main marketplace */
export async function getAuctionsFromDB() {
  await closeExpiredAuctionsAndFindWinners();

  return await prisma.auction.findMany({
    include: {
      bids: { orderBy: { timestamp: 'desc' } },
      seller: { select: { name: true, avatar: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/** Get seller dashboard auctions (both ACTIVE and ENDED) */
export async function getSellerDashboardFromDB(sellerId: string) {
  await closeExpiredAuctionsAndFindWinners();

  return await prisma.auction.findMany({
    where: { sellerId },
    include: {
      bids: {
        orderBy: { amount: 'desc' },
        include: { user: { select: { id: true, name: true, avatar: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}