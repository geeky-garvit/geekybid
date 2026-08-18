import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || 'auctions_db';

async function seedAdmin() {
  if (!MONGODB_URI) throw new Error('MONGODB_URI missing in .env.local');

  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');

    const adminExists = await usersCollection.findOne({ email: 'admin' });

    if (!adminExists) {
      await usersCollection.insertOne({
        id: 'user_admin_001',
        name: 'Administrator',
        email: 'admin',
        password: 'admin123', // Plaintext for demo
        avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Admin',
        role: 'admin',
        createdAt: new Date(),
      });
      console.log('✅ Admin user ("admin" / "admin123") created successfully!');
    } else {
      console.log('ℹ️ Admin user already exists.');
    }
  } catch (err) {
    console.error('Error seeding admin:', err);
  } finally {
    await client.close();
  }
}

seedAdmin();