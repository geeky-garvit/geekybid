import { faker } from '@faker-js/faker';
import { Auction } from '@/lib/types/auction';

const globalForAuctions = globalThis as unknown as {
  auctionsStore: Auction[] | null;
};

/**
 * Normalizes dynamic route IDs so matching works even if prefixes vary
 * (e.g. "1" matches "dummy-1" or "faker-1")
 */
function normalizeId(id: string | number): string {
  return String(id).trim().replace(/^(dummy|faker|user)-/, '');
}

async function generateInitialAuctions(): Promise<Auction[]> {
  let dummyAuctions: Auction[] = [];

  try {
    const res = await fetch('https://dummyjson.com/products?limit=0', {
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      dummyAuctions = (data.products || []).map((p: any) => ({
        id: `dummy-${p.id}`,
        title: p.title,
        description: p.description,
        category: p.category,
        startingPrice: Math.round(p.price * 0.5),
        currentHighestBid: p.price,
        minIncrement: 5,
        bidsCount: Math.floor(Math.random() * 25) + 1,
        images: p.images?.length ? p.images : [`https://picsum.photos/seed/dummy-${p.id}/600/600`],
        endTime: new Date(Date.now() + 3600 * 1000 * ((p.id % 48) + 1)).toISOString(),
        status: p.id % 5 === 0 ? 'ended' : 'live',
        history: [],
        seller: {
          id: `seller-${p.id}`,
          name: `Seller_${p.id}`,
          avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=Seller_${p.id}`,
          rating: 4.8,
        },
      }));
    }
  } catch (error) {
    console.error('Failed to fetch DummyJSON', error);
  }

  faker.seed(1993);
  const fakerAuctions: Auction[] = Array.from({ length: 300 }).map((_, index) => {
    const id = `faker-${index + 1}`;
    const sellerName = faker.person.firstName();
    const isEnded = faker.datatype.boolean({ probability: 0.2 });
    const basePrice = parseFloat(faker.commerce.price({ min: 10, max: 2000 }));
    const endTime = isEnded
      ? faker.date.recent({ days: 2 })
      : faker.date.soon({ days: 7 });

    return {
      id,
      title: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      category: faker.commerce.department().toLowerCase(),
      startingPrice: Math.round(basePrice * 0.5),
      currentHighestBid: basePrice,
      minIncrement: faker.helpers.arrayElement([5, 10, 20, 50]),
      bidsCount: faker.number.int({ min: 0, max: 80 }),
      images: [`https://picsum.photos/seed/${id}/600/600`],
      endTime: endTime.toISOString(),
      status: isEnded ? 'ended' : 'live',
      history: [],
      seller: {
        id: `seller-${id}`,
        name: sellerName,
        avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=${sellerName}`,
        rating: faker.number.float({ min: 3.5, max: 5, fractionDigits: 1 }),
      },
    };
  });

  return [...dummyAuctions, ...fakerAuctions];
}

export async function getAllAuctions(): Promise<Auction[]> {
  if (!globalForAuctions.auctionsStore) {
    globalForAuctions.auctionsStore = await generateInitialAuctions();
  }
  return globalForAuctions.auctionsStore;
}

export async function getAuctionById(id: string): Promise<Auction | null> {
  const auctions = await getAllAuctions();
  const targetId = String(id).trim();

  return (
    auctions.find(
      (a) => String(a.id) === targetId || normalizeId(a.id) === normalizeId(targetId)
    ) || null
  );
}

export async function addAuction(newAuction: Auction) {
  const auctions = await getAllAuctions();
  globalForAuctions.auctionsStore = [newAuction, ...auctions];
}

export async function placeBid(
  auctionId: string,
  amount: number,
  bidderName: string = 'Anonymous'
) {
  const auctions = await getAllAuctions();
  const targetId = String(auctionId).trim();

  const index = auctions.findIndex(
    (a) => String(a.id) === targetId || normalizeId(a.id) === normalizeId(targetId)
  );

  if (index === -1) {
    console.error(`[placeBid] ID "${auctionId}" not found in ${auctions.length} auctions.`);
    return null;
  }

  const currentAuction = auctions[index];
  const newBidEntry = {
    id: `bid-${Date.now()}`,
    amount,
    bidder: bidderName,
    time: new Date().toISOString(),
  };

  auctions[index] = {
    ...currentAuction,
    currentHighestBid: amount,
    bidsCount: currentAuction.bidsCount + 1,
    history: [newBidEntry, ...(currentAuction.history || [])],
  };

  globalForAuctions.auctionsStore = [...auctions];
  return auctions[index];
}