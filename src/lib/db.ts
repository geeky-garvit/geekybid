import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import bcrypt from 'bcryptjs';

// Global Prisma Singleton to prevent connection leaks during Next.js HMR
const globalForPrisma = global as unknown as { prisma: PrismaClient };

const dbUrl = process.env.DATABASE_URL || 'file:./dev.db';
const adapter = new PrismaBetterSqlite3({ url: dbUrl });

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// ---------------- HELPER UTILITIES ----------------

/**
 * Parses JSON image strings stored in SQLite into string arrays.
 */
export function parseAuctionImages(imagesJson: string | null | undefined): string[] {
  if (!imagesJson) return [];
  try {
    const parsed = JSON.parse(imagesJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Serializes string arrays into JSON strings for SQLite storage.
 */
export function serializeAuctionImages(images: string[]): string {
  return JSON.stringify(images || []);
}

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
      images: serializeAuctionImages(input.images),
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

  return {
    ...newAuction,
    images: parseAuctionImages(newAuction.images),
  };
}

export async function getAuctionById(id: string) {
  const auction = await prisma.auction.findUnique({
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

  if (!auction) return null;

  return {
    ...auction,
    images: parseAuctionImages(auction.images),
  };
}

export async function getActiveAuctions(category?: string) {
  const auctions = await prisma.auction.findMany({
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

  return auctions.map((auction: (typeof auctions)[number]) => ({
    ...auction,
    images: parseAuctionImages(auction.images),
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