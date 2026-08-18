import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

const DB_NAME = process.env.MONGODB_DB || 'auctions_db';

// ---------------- USER SCHEMAS & OPERATIONS ----------------

export interface UserDoc {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  avatar: string;
  role: 'user' | 'admin';
  createdAt: Date;
}

export async function findUserByEmail(email: string): Promise<UserDoc | null> {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  return await db.collection<UserDoc>('users').findOne({ email: email.toLowerCase().trim() });
}

export async function createUser(data: { name: string; email: string; passwordRaw: string }) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);

  const cleanEmail = data.email.toLowerCase().trim();
  const existingUser = await db.collection<UserDoc>('users').findOne({ email: cleanEmail });

  if (existingUser) {
    throw new Error('User already exists with this email.');
  }

  const passwordHash = await bcrypt.hash(data.passwordRaw, 10);
  const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const newUser: UserDoc = {
    id: userId,
    name: data.name.trim(),
    email: cleanEmail,
    passwordHash,
    avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(data.name)}`,
    role: 'user',
    createdAt: new Date(),
  };

  // 1. Store User in MongoDB
  await db.collection<UserDoc>('users').insertOne(newUser);

  // 2. Log Account Creation Activity
  await logUserActivity({
    userId,
    action: 'USER_REGISTERED',
    details: 'User created an account on GeekyBid',
  });

  const { passwordHash: _, ...safeUser } = newUser;
  return safeUser;
}

// ---------------- ACTIVITY LOGGING OPERATIONS ----------------

export interface ActivityDoc {
  userId: string;
  action: 'USER_REGISTERED' | 'USER_LOGGED_IN' | 'BID_PLACED' | 'AUCTION_CREATED' | 'AUCTION_WON';
  auctionId?: string;
  amount?: number;
  details?: string;
  timestamp: Date;
}

export async function logUserActivity(activity: Omit<ActivityDoc, 'timestamp'>) {
  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);

    await db.collection<ActivityDoc>('activity').insertOne({
      ...activity,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
}

export async function getUserActivityHistory(userId: string) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);

  return await db.collection<ActivityDoc>('activity')
    .find({ userId })
    .sort({ timestamp: -1 })
    .limit(50)
    .toArray();
}

// ---------------- SELLER COMMUNITY CREATION ----------------

export interface CommunityDoc {
  communityId: string;
  sellerId: string;
  title: string;
  createdAt: Date;
}

export async function createSellerCommunity(sellerId: string, title: string) {
  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);

    const communityId = `comm_${sellerId}`;

    const newCommunity: CommunityDoc = {
      communityId,
      sellerId,
      title,
      createdAt: new Date(),
    };

    // Upsert so a user only gets one primary community hub
    await db.collection<CommunityDoc>('communities').updateOne(
      { sellerId },
      { $setOnInsert: newCommunity },
      { upsert: true }
    );

    // Add seller as the owner/member of their own community
    await db.collection('community_members').updateOne(
      { communityId, userId: sellerId },
      {
        $setOnInsert: {
          communityId,
          userId: sellerId,
          role: 'SELLER',
          joinedAt: new Date(),
        },
      },
      { upsert: true }
    );

    return communityId;
  } catch (err) {
    console.error('Failed to create seller community:', err);
  }
}