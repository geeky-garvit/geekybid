
import { store, closeExpiredAuctions, placeBid, initializeStore } from '@/lib/store';

export async function syncAndSimulateAuctions() {
 
  if (!store.isInitialized) {
    await initializeStore();
  }

  closeExpiredAuctions();

  const liveAuctions = store.auctions.filter((a) => a.status === 'live');
  
  if (liveAuctions.length > 0) {
    const randomAuction = liveAuctions[Math.floor(Math.random() * liveAuctions.length)];
    const randomUser = store.users[Math.floor(Math.random() * store.users.length)];

    if (randomUser.id !== randomAuction.sellerId) {
      const nextBidAmount = parseFloat(
        (randomAuction.currentHighestBid + randomAuction.minIncrement).toFixed(2)
      );

      try {
        placeBid(randomAuction.id, nextBidAmount, randomUser.id, randomUser.name);
      } catch (err) {
       
      }
    }
  }

  return store.auctions;
}