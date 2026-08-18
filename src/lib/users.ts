import clientPromise from '@/lib/mongodb';
import { User } from '@/context/AuthContext';

const DB_NAME = process.env.MONGODB_DB || 'auctions_db';

export interface UserDocument {
  id: string;
  name: string;
  email: string;
  password: string; // Plaintext for demo, hash with bcrypt in production
  avatar: string;
  role?: string;
  createdAt: Date;
}

export async function findUserByEmail(emailOrUsername: string) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const searchKey = emailOrUsername.toLowerCase().trim();

  // Search by email or username/name match
  return await db.collection<UserDocument>('users').findOne({
    $or: [{ email: searchKey }, { name: searchKey }]
  });
}

export async function createUser(userData: Omit<UserDocument, '_id' | 'createdAt'>) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const newUser: UserDocument = {
    ...userData,
    email: userData.email.toLowerCase().trim(),
    role: userData.role || 'user',
    createdAt: new Date(),
  };
  await db.collection<UserDocument>('users').insertOne(newUser);
  return newUser;
}