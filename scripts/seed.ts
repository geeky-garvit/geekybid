// scripts/seed.ts
import { MongoClient, ObjectId } from 'mongodb';

// tsx automatically loads variables from .env.local
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB = process.env.MONGODB_DB || 'auctions_db';

console.log(`📡 Connecting using database: "${MONGODB_DB}"`);

const mockAuctions = [
  {
    _id: new ObjectId(),
    id: 'auc_1',
    title: 'Vintage Leica M3 Rangefinder Camera',
    description: 'Classic 1954 35mm rangefinder camera in excellent working condition with original 50mm Summicron lens.',
    category: 'photography',
    status: 'live',
    currentHighestBid: 1250,
    bidsCount: 18,
    endTime: new Date(Date.now() + 3 * 3600 * 1000), // Ends in 3 hours
    createdAt: new Date(),
  },
  {
    _id: new ObjectId(),
    id: 'auc_2',
    title: 'Apple Macintosh SE/30 (1989)',
    description: 'Fully restored vintage Apple Macintosh SE/30 with upgraded RAM and clean CRT monitor.',
    category: 'electronics',
    status: 'live',
    currentHighestBid: 420,
    bidsCount: 9,
    endTime: new Date(Date.now() + 18 * 3600 * 1000), // Ends in 18 hours
    createdAt: new Date(),
  },
  {
    _id: new ObjectId(),
    id: 'auc_3',
    title: 'Original Abstract Oil Painting - "Midnight Echoes"',
    description: 'Hand-painted canvas (36x48 inches) signed by contemporary artist Maya Lin.',
    category: 'art',
    status: 'live',
    currentHighestBid: 850,
    bidsCount: 24,
    endTime: new Date(Date.now() + 48 * 3600 * 1000), // Ends in 2 days
    createdAt: new Date(),
  },
  {
    _id: new ObjectId(),
    id: 'auc_4',
    title: 'First Edition Charizard Shadowless Holographic Card',
    description: 'PSA 8 Graded 1999 Pokémon Game Shadowless Charizard Holo.',
    category: 'collectibles',
    status: 'live',
    currentHighestBid: 3100,
    bidsCount: 41,
    endTime: new Date(Date.now() + 1 * 3600 * 1000), // Ends in 1 hour
    createdAt: new Date(),
  },
  {
    _id: new ObjectId(),
    id: 'auc_5',
    title: 'Rolex Submariner Date 116610LN',
    description: 'Pre-owned 2018 Rolex Submariner stainless steel with original box and papers.',
    category: 'jewelry',
    status: 'live',
    currentHighestBid: 8900,
    bidsCount: 15,
    endTime: new Date(Date.now() + 5 * 3600 * 1000), // Ends in 5 hours
    createdAt: new Date(),
  },
  {
    _id: new ObjectId(),
    id: 'auc_6',
    title: 'Vintage Leather Biker Jacket (1970s)',
    description: 'Authentic distressed black leather jacket, size Medium, nickel zippers.',
    category: 'fashion',
    status: 'ended',
    currentHighestBid: 180,
    bidsCount: 7,
    endTime: new Date(Date.now() - 24 * 3600 * 1000), // Ended yesterday
    createdAt: new Date(Date.now() - 7 * 24 * 3600 * 1000),
  },
];

async function seed() {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log('⏳ Connecting to MongoDB...');
    await client.connect();
    const db = client.db(MONGODB_DB);
    const collection = db.collection('auctions');

    // 1. Clear existing items
    await collection.deleteMany({});
    console.log('🧹 Cleared existing "auctions" collection.');

    // 2. Insert mock items
    await collection.insertMany(mockAuctions);
    console.log(`✅ Inserted ${mockAuctions.length} mock auctions.`);

    // 3. Create MongoDB Indexes
    console.log('⚡ Creating database indexes...');
    await collection.createIndex({ category: 1, status: 1 });
    await collection.createIndex({ status: 1, endTime: 1 });
    await collection.createIndex({ currentHighestBid: 1 });
    await collection.createIndex({ bidsCount: -1 });
    await collection.createIndex({ title: 'text', description: 'text' });
    console.log('🚀 Indexes created successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await client.close();
    process.exit(0);
  }
}

seed();