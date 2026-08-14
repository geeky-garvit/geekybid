// src/lib/store.ts
import { faker } from '@faker-js/faker';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export interface Bid {
  id: string;
  bidderId: string;
  bidderName: string;
  amount: number;
  time: string;
}

export interface Auction {
  id: string;
  title: string;
  description: string;
  category: string;
  startingPrice: number;
  currentHighestBid: number;
  minIncrement: number;
  bidsCount: number;
  images: string[];
  endTime: string;
  status: 'live' | 'ended' | 'paid';
  sellerId: string;
  sellerName: string;
  sellerAvatar: string;
  history: Bid[];
}

export interface Watchlist {
  userId: string;
  auctionId: string;
}

export interface Order {
  id: string;
  auctionId: string;
  winnerId: string;
  amount: number;
  isPaid: boolean;
}

interface GlobalStore {
  users: User[];
  auctions: Auction[];
  watchlists: Watchlist[];
  orders: Order[];
  currentUser: User | null;
  isInitialized: boolean;
}

const CATEGORIES = [
  'electronics',
  'photography',
  'collectibles',
  'art',
  'fashion',
  'jewelry',
  'general',
];

const INITIAL_STORE: GlobalStore = {
  users: [
    {
      id: 'user_bidder1',
      name: 'Alex Vance',
      email: 'alex@example.com',
      avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Alex',
    },
    {
      id: 'user_seller1',
      name: 'Sarah Connor',
      email: 'sarah@example.com',
      avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Sarah',
    },
    {
      id: 'user_bidder2',
      name: 'David Light',
      email: 'david@example.com',
      avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=David',
    },
    {
      id: 'user_bidder3',
      name: 'Elena Rostova',
      email: 'elena@example.com',
      avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Elena',
    },
  ],
  auctions: [],
  watchlists: [],
  orders: [],
  currentUser: {
    id: 'user_bidder1',
    name: 'Alex Vance',
    email: 'alex@example.com',
    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Alex',
  },
  isInitialized: false,
};

// Bind store to globalThis for Next.js HMR preservation
const globalForStore = globalThis as unknown as {
  store: GlobalStore | undefined;
};

export const store = globalForStore.store ?? INITIAL_STORE;

if (process.env.NODE_ENV !== 'production') {
  globalForStore.store = store;
}

// Helper: DiceBear Avatar Generator
export function getAvatarUrl(seed: string): string {
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
}

// Helper: Picsum Image Generator
export function getItemImageUrl(seedId: string, index: number = 1): string {
  return `https://picsum.photos/seed/${encodeURIComponent(seedId)}-${index}/600/600`;
}

// Helper: Category Normalizer
function normalizeCategory(category: string): string {
  const cat = category.toLowerCase();
  if (cat.includes('laptop') || cat.includes('phone') || cat.includes('tablet')) return 'electronics';
  if (cat.includes('camera') || cat.includes('photo')) return 'photography';
  if (cat.includes('watch') || cat.includes('jewel')) return 'jewelry';
  if (cat.includes('cloth') || cat.includes('shoe') || cat.includes('bag')) return 'fashion';
  if (cat.includes('art') || cat.includes('decor')) return 'art';
  if (cat.includes('antique') || cat.includes('coin')) return 'collectibles';
  return 'general';
}

// Helper: Simulated Bid Generator
function generateBidHistory(startingPrice: number, bidsCount: number, endTimeStr: string): { history: Bid[]; currentHighestBid: number } {
  const history: Bid[] = [];
  let currentBid = startingPrice;
  const endTime = new Date(endTimeStr).getTime();
  const startTime = endTime - 7 * 24 * 60 * 60 * 1000;

  for (let i = 0; i < bidsCount; i++) {
    const increment = faker.number.float({ min: 5, max: 45, fractionDigits: 2 });
    currentBid = parseFloat((currentBid + increment).toFixed(2));

    const bidderName = faker.person.fullName();
    const bidTime = new Date(
      startTime + (i / Math.max(bidsCount, 1)) * (endTime - startTime)
    ).toISOString();

    history.unshift({
      id: `bid-${faker.string.alphanumeric(8)}`,
      bidderId: `usr-${faker.string.alphanumeric(6)}`,
      bidderName,
      amount: currentBid,
      time: bidTime,
    });
  }

  return { history, currentHighestBid: currentBid };
}

/**
 * Seeds dataset combining DummyJSON (~200 items) + Faker.js (~300 items)
 */
export async function initializeStore() {
  if (store.isInitialized && store.auctions.length > 0) return;

  const dummyAuctions: Auction[] = [];

  // 1. Fetch DummyJSON items
  try {
    const res = await fetch('https://dummyjson.com/products?limit=0');
    if (res.ok) {
      const data = await res.json();
      data.products.forEach((p: { id: number; title: string; description: string; price: number; category: string; images: string[] }) => {
        const bidsCount = faker.number.int({ min: 1, max: 25 });
        const isLive = faker.datatype.boolean({ probability: 0.85 });
        const endTime = isLive
          ? faker.date.soon({ days: 5 }).toISOString()
          : faker.date.recent({ days: 10 }).toISOString();

        const startingPrice = Math.max(10, Math.round(p.price * 0.4));
        const { history, currentHighestBid } = generateBidHistory(startingPrice, bidsCount, endTime);
        const sellerName = faker.person.fullName();

        dummyAuctions.push({
          id: `dummy-${p.id}`,
          title: p.title,
          description: p.description,
          category: normalizeCategory(p.category),
          startingPrice,
          currentHighestBid,
          minIncrement: 5,
          bidsCount,
          images: [
            getItemImageUrl(`dummy-${p.id}`, 1),
            getItemImageUrl(`dummy-${p.id}`, 2),
          ],
          endTime,
          status: isLive ? 'live' : 'ended',
          sellerId: `usr-dummy-${p.id}`,
          sellerName,
          sellerAvatar: getAvatarUrl(sellerName),
          history,
        });
      });
    }
  } catch (err) {
    console.warn('Failed fetching DummyJSON products, proceeding with Faker-only fallback:', err);
  }

  // 2. Generate Faker.js items (~300 items)
  const fakerAuctions: Auction[] = [];
  for (let i = 1; i <= 300; i++) {
    const seedId = `faker-${i}`;
    const category = faker.helpers.arrayElement(CATEGORIES);
    const bidsCount = faker.number.int({ min: 0, max: 30 });
    const startingPrice = parseFloat(faker.commerce.price({ min: 15, max: 600, dec: 2 }));

    const isLive = faker.datatype.boolean({ probability: 0.8 });
    const endTime = isLive
      ? faker.date.soon({ days: 7 }).toISOString()
      : faker.date.recent({ days: 14 }).toISOString();

    const { history, currentHighestBid } = generateBidHistory(startingPrice, bidsCount, endTime);
    const sellerName = faker.person.fullName();

    fakerAuctions.push({
      id: seedId,
      title: `${faker.commerce.productAdjective()} ${faker.commerce.productName()}`,
      description: faker.commerce.productDescription(),
      category,
      startingPrice,
      currentHighestBid,
      minIncrement: 5,
      bidsCount,
      images: [
        getItemImageUrl(seedId, 1),
        getItemImageUrl(seedId, 2),
      ],
      endTime,
      status: isLive ? 'live' : 'ended',
      sellerId: `usr-faker-${i}`,
      sellerName,
      sellerAvatar: getAvatarUrl(sellerName),
      history,
    });
  }

  store.auctions = [...dummyAuctions, ...fakerAuctions];
  store.isInitialized = true;
}

// Store Helper Methods
export function getAuctions(filter?: { category?: string; status?: string; search?: string }) {
  let list = [...store.auctions];

  if (filter?.category && filter.category !== 'all') {
    list = list.filter((a) => a.category.toLowerCase() === filter.category?.toLowerCase());
  }
  if (filter?.status && filter.status !== 'all') {
    list = list.filter((a) => a.status === filter.status);
  }
  if (filter?.search) {
    const q = filter.search.toLowerCase();
    list = list.filter((a) => a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q));
  }

  return list;
}

export function getAuctionById(id: string): Auction | undefined {
  const cleanId = id.trim();
  let auction = store.auctions.find((a) => a.id === cleanId);

  if (!auction && (cleanId.startsWith('dummy-') || cleanId.startsWith('faker-') || /^\d+$/.test(cleanId))) {
    const numId = cleanId.replace(/^(dummy-|faker-)/, '');
    const sellerName = `Seller #${numId}`;
    auction = {
      id: cleanId,
      title: `Auction Item #${numId}`,
      description: 'Auto-generated auction item sourced dynamically.',
      category: 'general',
      startingPrice: 40,
      currentHighestBid: 40,
      minIncrement: 5,
      bidsCount: 0,
      images: [
        getItemImageUrl(cleanId, 1),
        getItemImageUrl(cleanId, 2),
      ],
      endTime: new Date(Date.now() + 86400000).toISOString(),
      status: 'live',
      sellerId: `seller-${numId}`,
      sellerName,
      sellerAvatar: getAvatarUrl(sellerName),
      history: [],
    };
    store.auctions.push(auction);
  }

  return auction;
}

export function placeBid(auctionId: string, amount: number, userId: string, userName: string) {
  const auction = getAuctionById(auctionId);
  if (!auction) throw new Error('Auction not found');
  if (auction.status !== 'live') throw new Error('Auction is not live');
  if (new Date() > new Date(auction.endTime)) throw new Error('Auction has expired');
  if (auction.sellerId === userId) throw new Error('Sellers cannot bid on their own auctions');

  const minRequired = auction.currentHighestBid + auction.minIncrement;
  if (amount < minRequired) {
    throw new Error(`Bid must be at least $${minRequired.toFixed(2)}`);
  }

  // Anti-sniping rule: extend by 2 minutes if placed in final 2 minutes
  const now = new Date();
  const timeRemainingMs = new Date(auction.endTime).getTime() - now.getTime();
  if (timeRemainingMs <= 2 * 60 * 1000) {
    auction.endTime = new Date(new Date(auction.endTime).getTime() + 2 * 60 * 1000).toISOString();
  }

  // Record Bid
  auction.currentHighestBid = amount;
  auction.bidsCount += 1;
  auction.history.unshift({
    id: 'bid-' + Date.now(),
    bidderId: userId,
    bidderName: userName,
    amount,
    time: new Date().toISOString(),
  });

  return auction;
}

export function createAuction(data: Omit<Auction, 'id' | 'currentHighestBid' | 'bidsCount' | 'status' | 'history'>) {
  const newAuction: Auction = {
    ...data,
    id: 'auc-' + Date.now(),
    currentHighestBid: data.startingPrice,
    bidsCount: 0,
    status: 'live',
    history: [],
  };
  store.auctions.unshift(newAuction);
  return newAuction;
}

export function closeExpiredAuctions() {
  const now = new Date();
  const closed = [];

  for (const auction of store.auctions) {
    if (auction.status === 'live' && new Date(auction.endTime) <= now) {
      auction.status = 'ended';
      const winner = auction.history[0];

      if (winner) {
        const order: Order = {
          id: 'ord-' + Date.now(),
          auctionId: auction.id,
          winnerId: winner.bidderId,
          amount: winner.amount,
          isPaid: false,
        };
        store.orders.push(order);
        closed.push({ auctionId: auction.id, winner: winner.bidderName, amount: winner.amount });
      } else {
        closed.push({ auctionId: auction.id, winner: null, amount: 0 });
      }
    }
  }
  return closed;
}