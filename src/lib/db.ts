import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import bcrypt from 'bcryptjs';

// Required for Neon WebSocket connections in serverless environments
neonConfig.webSocketConstructor = ws;

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const connectionString = process.env.DATABASE_URL!;

// Pass the connection config object directly to PrismaNeon
const adapter = new PrismaNeon({ connectionString });

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// ---------------- USER OPERATIONS ----------------

export interface UserDoc {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  avatar: string | null;
  role: string;
  createdAt: Date;
}

export async function findUserByEmail(email: string) {
  const cleanEmail = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });

  if (!user) return null;

  return {
    ...user,
    passwordHash: user.password,
  };
}

export async function createUser(data: { name: string; email: string; passwordRaw: string }) {
  const cleanEmail = data.email.toLowerCase().trim();

  const existingUser = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });

  if (existingUser) {
    throw new Error('User already exists with this email.');
  }

  const passwordHash = await bcrypt.hash(data.passwordRaw, 10);
  const avatarUrl = `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(
    data.name.trim()
  )}`;

  const newUser = await prisma.user.create({
    data: {
      name: data.name.trim(),
      email: cleanEmail,
      password: passwordHash,
      avatar: avatarUrl,
      role: 'collector',
    },
  });

  await logUserActivity({
    userId: newUser.id,
    action: 'USER_REGISTERED',
    details: 'User created an account on GeekyBid',
  });

  const { password: _, ...safeUser } = newUser;
  return safeUser;
}

// ---------------- AUCTION OPERATIONS ----------------

export interface CreateAuctionInput {
  title: string;
  description: string;
  category: string;
  startingBid: number;
  minIncrement?: number;
  images: string[];
  attributes?: Record<string, unknown>;
  endTime: Date;
  sellerId: string;
}

export async function createAuction(input: CreateAuctionInput) {
  const newAuction = await prisma.auction.create({
    data: {
      title: input.title.trim(),
      description: input.description.trim(),
      category: input.category.trim(),
      startingBid: input.startingBid,
      currentPrice: input.startingBid,
      minIncrement: input.minIncrement ?? 5.0,
      images: input.images,
      attributes: (input.attributes as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      endTime: input.endTime,
      sellerId: input.sellerId,
    },
  });

  await logUserActivity({
    userId: input.sellerId,
    action: 'AUCTION_CREATED',
    auctionId: newAuction.id,
    amount: input.startingBid,
    details: `Created auction: ${newAuction.title}`,
  });

  return newAuction;
}

export async function getAuctionById(id: string) {
  return await prisma.auction.findUnique({
    where: { id },
    include: {
      seller: {
        select: { id: true, name: true, avatar: true },
      },
      bids: {
        orderBy: { timestamp: 'desc' },
        include: {
          user: { select: { id: true, name: true, avatar: true } },
        },
      },
    },
  });
}

export async function getActiveAuctions(category?: string) {
  return await prisma.auction.findMany({
    where: {
      status: 'ACTIVE',
      ...(category ? { category } : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: {
      seller: {
        select: { id: true, name: true, avatar: true },
      },
    },
  });
}

export async function getAuctionResult(id: string) {
  const auction = await prisma.auction.findUnique({
    where: {
      id,
      status: {
        in: ['ENDED', 'PAID'],
      },
    },
    include: {
      bids: {
        orderBy: {
          amount: 'desc',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      },
    },
  });

  if (!auction) {
    return null;
  }

  const winningBid = auction.bids[0] ?? null;

  return {
    ...auction,
    winningBid,
  };
}

export async function closeExpiredAuctions() {
  const expiredAuctions = await prisma.auction.findMany({
    where: {
      status: 'ACTIVE',
      endTime: {
        lte: new Date(),
      },
    },
    include: {
      bids: {
        orderBy: {
          amount: 'desc',
        },
        take: 1,
      },
    },
  });

  for (const auction of expiredAuctions) {
    const winningBid = auction.bids[0];

    await prisma.auction.update({
      where: {
        id: auction.id,
      },
      data: {
        status: 'ENDED',

        // If there was a bid, store the winning bidder.
        // If there were no bids, keep it null.
        highestBidderId: winningBid?.userId ?? null,

        // If there was a bid, make sure currentPrice
        // reflects the winning bid.
        ...(winningBid
          ? {
              currentPrice: winningBid.amount,
            }
          : {}),
      },
    });
  }

  return expiredAuctions.length;
}

export async function getCompletedAuctions() {
  // First mark expired ACTIVE auctions as ENDED
  await closeExpiredAuctions();

  // Get ALL completed auctions, including auctions with no bids
  const auctions = await prisma.auction.findMany({
    where: {
      status: {
        in: ['ENDED', 'PAID'],
      },
    },
    orderBy: {
      endTime: 'desc',
    },
  });

  // Get the users who won auctions
  const winnerIds = auctions
    .map((auction) => auction.highestBidderId)
    .filter((id): id is string => id !== null);

  const winners = await prisma.user.findMany({
    where: {
      id: {
        in: winnerIds,
      },
    },
    select: {
      id: true,
      name: true,
      avatar: true,
    },
  });

  // Create a quick lookup: userId → user
  const winnerMap = new Map(
    winners.map((winner) => [winner.id, winner])
  );

  // Add winner information to each auction
  return auctions.map((auction) => ({
    ...auction,

    winner: auction.highestBidderId
      ? winnerMap.get(auction.highestBidderId) ?? null
      : null,
  }));
}


// ---------------- ACTIVITY LOGGING OPERATIONS ----------------

export interface ActivityInput {
  userId: string;
  action: 'USER_REGISTERED' | 'USER_LOGGED_IN' | 'BID_PLACED' | 'AUCTION_CREATED' | 'AUCTION_WON';
  auctionId?: string;
  amount?: number;
  details?: string;
}

export async function logUserActivity(activity: ActivityInput) {
  try {
    return await prisma.activity.create({
      data: {
        userId: activity.userId,
        action: activity.action,
        details: activity.details,
        amount: activity.amount,
      },
    });
  } catch (err) {
    console.error('Failed to log activity to SQL:', err);
  }
}

export async function getUserActivityHistory(userId: string) {
  return await prisma.activity.findMany({
    where: { userId },
    orderBy: { timestamp: 'desc' },
    take: 50,
  });
}

// ---------------- SELLER COMMUNITY CREATION ----------------

export async function createSellerCommunity(sellerId: string, title: string) {
  try {
    const communityId = `comm_${sellerId}`;

    const community = await prisma.community.upsert({
      where: { id: communityId },
      update: {},
      create: {
        id: communityId,
        sellerId,
        title,
      },
    });

    await prisma.communityMember.upsert({
      where: {
        communityId_userId: {
          communityId,
          userId: sellerId,
        },
      },
      update: {},
      create: {
        communityId,
        userId: sellerId,
        role: 'SELLER',
      },
    });

    return community.id;
  } catch (err) {
    console.error('Failed to create seller community in SQL:', err);
  }
}