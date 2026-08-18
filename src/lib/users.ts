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

export async function findUserByEmail(email: string) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  return await db.collection<UserDocument>('users').findOne({ email: email.toLowerCase() });
}

export async function createUser(userData: Omit<UserDocument, '_id' | 'createdAt'>) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const newUser: UserDocument = {
    ...userData,
    email: userData.email.toLowerCase(),
    createdAt: new Date(),
  };
  await db.collection<UserDocument>('users').insertOne(newUser);
  return newUser;
}