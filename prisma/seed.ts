import 'dotenv/config';
import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('Seeding Neon database with DummyJSON items...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. Create default seller user
  const seller = await prisma.user.upsert({
    where: { email: 'sarah@example.com' },
    update: {},
    create: {
      name: 'Sarah Connor',
      email: 'sarah@example.com',
      password: hashedPassword,
      avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Sarah',
      role: 'seller',
    },
  });

  // 2. Fetch DummyJSON products
  const res = await fetch('https://dummyjson.com/products?limit=15');
  const data = await res.json();

  for (const product of data.products) {
    const startingBid = Math.round(product.price);

    await prisma.auction.create({
      data: {
        title: product.title,
        description: product.description,
        category: product.category,
        startingBid,
        currentPrice: startingBid,
        minIncrement: 5.0,
        status: 'ACTIVE',
        images: product.images && product.images.length ? product.images : [product.thumbnail],
        // Random end time between 10 mins and 48 hours
        endTime: new Date(Date.now() + (10 * 60 * 1000 + Math.random() * 172800000)),
        sellerId: seller.id,
      },
    });
  }

  console.log('✅ Seed complete: Products stored in PostgreSQL!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });