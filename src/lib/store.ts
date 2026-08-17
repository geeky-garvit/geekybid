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
  createdAt: string;
}

interface GlobalStore {
  users: User[];
  auctions: Auction[];
  watchlists: Watchlist[];
  orders: Order[];
  currentUser: User | null;
  isInitialized: boolean;
}

interface FilterOptions {
  category?: string;
  status?: string;
  search?: string;
}

interface CreateAuctionPayload {
  title: string;
  description: string;
  category: string;
  startingPrice: number;
  minIncrement: number;
  images: string[];
  endTime: string;
  sellerId: string;
  sellerName: string;
  sellerAvatar: string;
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

const globalForStore = globalThis as unknown as {
  store: GlobalStore | undefined;
};

export const store = globalForStore.store ?? INITIAL_STORE;

if (process.env.NODE_ENV !== 'production') {
  globalForStore.store = store;
}

// Helpers
export function saveAuctions(updatedAuctions: Auction[]): void {
  store.auctions = updatedAuctions;
  if (typeof window !== 'undefined') {
    localStorage.setItem('geekybid_auctions', JSON.stringify(store.auctions));
  }
}

export function getAvatarUrl(seed: string): string {
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
}

export function getItemImageUrl(seedId: string, index: number = 1): string {
  return `https://picsum.photos/seed/${encodeURIComponent(seedId)}-${index}/600/600`;
}

function normalizeCategory(category: string): string {
  const cat = category.toLowerCase();
  if (cat.includes('laptop') || cat.includes('phone') || cat.includes('tablet') || cat.includes('smartphones')) return 'electronics';
  if (cat.includes('camera') || cat.includes('photo')) return 'photography';
  if (cat.includes('watch') || cat.includes('jewel') || cat.includes('womens-watches') || cat.includes('mens-watches')) return 'jewelry';
  if (cat.includes('cloth') || cat.includes('shoe') || cat.includes('bag') || cat.includes('tops') || cat.includes('dresses')) return 'fashion';
  if (cat.includes('art') || cat.includes('decor') || cat.includes('home-decoration')) return 'art';
  if (cat.includes('antique') || cat.includes('coin')) return 'collectibles';
  return 'general';
}

function generateBidHistory(
  startingPrice: number,
  targetBidsCount: number,
  endTimeStr: string
): { history: Bid[]; currentHighestBid: number } {
  const history: Bid[] = [];
  let currentBid = startingPrice;
  const endTime = new Date(endTimeStr).getTime();
  const startTime = endTime - 7 * 24 * 60 * 60 * 1000;

  for (let i = 0; i < targetBidsCount; i++) {
    const increment = faker.number.float({ min: 2, max: 25, fractionDigits: 2 });
    currentBid = parseFloat((currentBid + increment).toFixed(2));

    const bidder = store.users[i % store.users.length] || {
      id: `usr-${faker.string.alphanumeric(6)}`,
      name: faker.person.fullName(),
    };

    const bidTime = new Date(
      startTime + ((i + 1) / Math.max(targetBidsCount, 1)) * (endTime - startTime)
    ).toISOString();

    history.unshift({
      id: `bid-${faker.string.alphanumeric(8)}`,
      bidderId: bidder.id,
      bidderName: bidder.name,
      amount: currentBid,
      time: bidTime,
    });
  }

  return { history, currentHighestBid: currentBid };
}

// Global Store Initializer
export async function initializeStore(): Promise<void> {
  if (store.isInitialized && store.auctions.length > 0) return;

  const userCreatedAuctions = store.auctions.filter((a) => a.id.startsWith('auc-'));
  const dummyAuctions: Auction[] = [];

  try {
    const res = await fetch('https://dummyjson.com/products?limit=0');
    if (res.ok) {
      const data = await res.json();
      data.products.forEach(
        (p: { id: number; title: string; description: string; price: number; category: string; images?: string[]; thumbnail?: string }) => {
          const targetBids = faker.number.int({ min: 0, max: 18 });
          const isLive = faker.datatype.boolean({ probability: 0.85 });
          const endTime = isLive
            ? faker.date.soon({ days: 5 }).toISOString()
            : faker.date.recent({ days: 10 }).toISOString();

          const startingPrice = Math.max(10, Math.round(p.price * 0.4));
          const { history, currentHighestBid } = generateBidHistory(startingPrice, targetBids, endTime);
          const sellerName = faker.person.fullName();

          const productImages = p.images && p.images.length > 0
            ? p.images
            : [p.thumbnail || getItemImageUrl(`dummy-${p.id}`, 1), getItemImageUrl(`dummy-${p.id}`, 2)];

          dummyAuctions.push({
            id: `dummy-${p.id}`,
            title: p.title,
            description: p.description,
            category: normalizeCategory(p.category),
            startingPrice,
            currentHighestBid,
            minIncrement: 5,
            bidsCount: history.length,
            images: productImages,
            endTime,
            status: isLive ? 'live' : 'ended',
            sellerId: `usr-dummy-${p.id}`,
            sellerName,
            sellerAvatar: getAvatarUrl(sellerName),
            history,
          });
        }
      );
    }
  } catch (err) {
    console.warn('Failed fetching external inventory, initializing fallback dataset:', err);
  }

  const fakerAuctions: Auction[] = [];
  for (let i = 1; i <= 300; i++) {
    const seedId = `faker-${i}`;
    const category = faker.helpers.arrayElement(CATEGORIES);
    const targetBids = faker.number.int({ min: 0, max: 22 });
    const startingPrice = parseFloat(faker.commerce.price({ min: 15, max: 600, dec: 2 }));

    const isLive = faker.datatype.boolean({ probability: 0.8 });
    const endTime = isLive
      ? faker.date.soon({ days: 7 }).toISOString()
      : faker.date.recent({ days: 14 }).toISOString();

    const { history, currentHighestBid } = generateBidHistory(startingPrice, targetBids, endTime);
    const sellerName = faker.person.fullName();

    fakerAuctions.push({
      id: seedId,
      title: `${faker.commerce.productAdjective()} ${faker.commerce.productName()}`,
      description: faker.commerce.productDescription(),
      category,
      startingPrice,
      currentHighestBid,
      minIncrement: 5,
      bidsCount: history.length,
      images: [getItemImageUrl(seedId, 1), getItemImageUrl(seedId, 2)],
      endTime,
      status: isLive ? 'live' : 'ended',
      sellerId: `usr-faker-${i}`,
      sellerName,
      sellerAvatar: getAvatarUrl(sellerName),
      history,
    });
  }

  store.auctions = [...userCreatedAuctions, ...dummyAuctions, ...fakerAuctions];
  store.isInitialized = true;
}

// Data Fetchers & Real-Time Synchronizers
export function getAuctions(filter?: FilterOptions): Auction[] {
  closeExpiredAuctions();
  let list = store.auctions.map((a) => ({
    ...a,
    bidsCount: a.history ? a.history.length : a.bidsCount,
  }));

  if (filter?.category && filter.category !== 'all') {
    list = list.filter((a) => a.category.toLowerCase() === filter.category?.toLowerCase());
  }
  if (filter?.status && filter.status !== 'all') {
    list = list.filter((a) => a.status === filter.status);
  }
  if (filter?.search) {
    const query = filter.search.toLowerCase();
    list = list.filter(
      (a) => a.title.toLowerCase().includes(query) || a.description.toLowerCase().includes(query)
    );
  }

  return list;
}

export function getAuctionById(id: string): Auction | undefined {
  closeExpiredAuctions();
  const cleanId = decodeURIComponent(id).trim();

  let auction = store.auctions.find(
    (a) =>
      a.id === cleanId ||
      a.id === `faker-${cleanId}` ||
      a.id === `dummy-${cleanId}` ||
      a.id.replace(/^(dummy-|faker-)/, '') === cleanId.replace(/^(dummy-|faker-)/, '')
  );

  if (auction) {
    auction.bidsCount = auction.history ? auction.history.length : auction.bidsCount;
    if (new Date(auction.endTime) <= new Date() && auction.status === 'live') {
      auction.status = 'ended';
    }
  }

  return auction;
}

export function toggleWatchlist(userId: string, auctionId: string): boolean {
  const index = store.watchlists.findIndex(
    (w) => w.userId === userId && w.auctionId === auctionId
  );
  if (index >= 0) {
    store.watchlists.splice(index, 1);
    return false;
  } else {
    store.watchlists.push({ userId, auctionId });
    return true;
  }
}

export function getWatchlistByUser(userId: string): Auction[] {
  const auctionIds = store.watchlists
    .filter((w) => w.userId === userId)
    .map((w) => w.auctionId);
  return store.auctions.filter((a) => auctionIds.includes(a.id));
}

export function getOrdersByUser(userId: string): Order[] {
  return store.orders.filter((o) => o.winnerId === userId);
}

export function getAuctionsBySeller(sellerId: string): Auction[] {
  return store.auctions.filter((a) => a.sellerId === sellerId);
}

export function getBidsByUser(userId: string): { auction: Auction; userBids: Bid[] }[] {
  return store.auctions
    .filter((a) => a.history.some((b) => b.bidderId === userId))
    .map((a) => ({
      auction: a,
      userBids: a.history.filter((b) => b.bidderId === userId),
    }));
}

export function placeBid(
  auctionId: string,
  amount: number,
  userId: string,
  userName: string
): Auction {
  const auction = getAuctionById(auctionId);
  if (!auction) throw new Error('Auction not found');
  if (auction.status !== 'live') throw new Error('Auction is not live');
  if (new Date() > new Date(auction.endTime)) {
    auction.status = 'ended';
    throw new Error('Auction has expired');
  }
  if (auction.sellerId === userId) throw new Error('Sellers cannot bid on their own auctions');

  const minRequired = auction.currentHighestBid + auction.minIncrement;
  if (amount < minRequired) {
    throw new Error(`Bid must be at least $${minRequired.toFixed(2)}`);
  }

  const now = new Date();
  const timeRemainingMs = new Date(auction.endTime).getTime() - now.getTime();
  if (timeRemainingMs <= 2 * 60 * 1000) {
    auction.endTime = new Date(new Date(auction.endTime).getTime() + 2 * 60 * 1000).toISOString();
  }

  auction.currentHighestBid = amount;
  auction.history.unshift({
    id: `bid-${Date.now()}`,
    bidderId: userId,
    bidderName: userName,
    amount,
    time: new Date().toISOString(),
  });
  auction.bidsCount = auction.history.length;

  return auction;
}

export function createAuction(data: CreateAuctionPayload): Auction {
  const newAuction: Auction = {
    ...data,
    id: `auc-${Date.now()}`,
    currentHighestBid: data.startingPrice,
    bidsCount: 0,
    status: 'live',
    history: [],
  };

  store.auctions.unshift(newAuction);
  store.isInitialized = true;
  return newAuction;
}

export function updateAuctionEndTime(auctionId: string, newEndTime: string): Auction | undefined {
  const auctions = getAuctions();
  const index = auctions.findIndex((a) => a.id === auctionId);

  if (index !== -1) {
    auctions[index].endTime = newEndTime;
    saveAuctions(auctions);
    return auctions[index];
  }

  return undefined;
}

export function closeExpiredAuctions(): Array<{
  auctionId: string;
  winner: string | null;
  amount: number;
}> {
  const now = new Date();
  const closed = [];

  for (const auction of store.auctions) {
    if (auction.status === 'live' && new Date(auction.endTime) <= now) {
      auction.status = 'ended';
      const winner = auction.history[0];

      if (winner) {
        const orderExists = store.orders.some((o) => o.auctionId === auction.id);
        if (!orderExists) {
          const order: Order = {
            id: `ord-${Date.now()}-${Math.random()}`,
            auctionId: auction.id,
            winnerId: winner.bidderId,
            amount: winner.amount,
            isPaid: false,
            createdAt: new Date().toISOString(),
          };
          store.orders.push(order);
        }
        closed.push({ auctionId: auction.id, winner: winner.bidderName, amount: winner.amount });
      } else {
        closed.push({ auctionId: auction.id, winner: null, amount: 0 });
      }
    }
  }
  return closed;
}