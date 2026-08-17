// src/lib/auction-engine.ts
import { store, closeExpiredAuctions, placeBid, initializeStore } from '@/lib/store';

/**
 * Ensures store is initialized, closes expired auctions,
 * and simulates background bids from other sellers/bidders.
 */
export async function syncAndSimulateAuctions() {
  // 1. Ensure seed data exists
  if (!store.isInitialized) {
    await initializeStore();
  }

  // 2. Transition expired auctions to 'ended' & generate Orders for winners
  closeExpiredAuctions();

  // 3. Simulate continuous real-time rival bids on active listings
  const liveAuctions = store.auctions.filter((a) => a.status === 'live');
  
  if (liveAuctions.length > 0) {
    // Pick 1-2 random auctions to simulate active competing bidders
    const randomAuction = liveAuctions[Math.floor(Math.random() * liveAuctions.length)];
    const randomUser = store.users[Math.floor(Math.random() * store.users.length)];

    // Ensure the bidder is not the seller
    if (randomUser.id !== randomAuction.sellerId) {
      const nextBidAmount = parseFloat(
        (randomAuction.currentHighestBid + randomAuction.minIncrement).toFixed(2)
      );

      try {
        placeBid(randomAuction.id, nextBidAmount, randomUser.id, randomUser.name);
      } catch (err) {
        // Silently skip if auction expired mid-turn
      }
    }
  }

  return store.auctions;
}