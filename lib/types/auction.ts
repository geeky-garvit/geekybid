export interface BidLog {
  id: string;
  bidder: string; // e.g. "a***r"
  amount: number;
  time: string;
}

export interface Seller {
  id: string;
  name: string;
  avatar: string;
  rating: number;
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
  endTime: string; // ISO String for Live Countdown
  status: 'live' | 'ended' | 'draft' | 'paid';
  seller: Seller;
  history: BidLog[];
}
