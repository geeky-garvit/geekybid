import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

const DB_NAME = process.env.MONGODB_DB || 'auctions_db';

export interface UserDocument {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  avatar: string;
  role: 'user' | 'admin';
  createdAt: Date;
}

export async function findUserByEmail(email: string) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const cleanEmail = email.toLowerCase().trim();

  return await db.collection<UserDocument>('users').findOne({ email: cleanEmail });
}

export async function createUser(data: { name: string; email: string; passwordRaw: string }) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);

  const cleanEmail = data.email.toLowerCase().trim();
  const passwordHash = await bcrypt.hash(data.passwordRaw, 10);

  const newUser: UserDocument = {
    id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: data.name.trim(),
    email: cleanEmail,
    passwordHash,
    avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(data.name)}`,
    role: 'user',
    createdAt: new Date(),
  };

  await db.collection<UserDocument>('users').insertOne(newUser as any);

  // Return user without passwordHash
  const { passwordHash: _, ...safeUser } = newUser;
  return safeUser;
}

export async function verifyUserPassword(passwordRaw: string, passwordHash: string): Promise<boolean> {
  return await bcrypt.compare(passwordRaw, passwordHash);
}