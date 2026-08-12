export interface BidLog {
  id: string;
  bidder: string;
  amount: number;
  time: string;
}

export interface Auction {
  id: string;
  title: string;
  category: string;
  currentHighestBid: number;
  bidsCount: number;
  images: string[];
  history: BidLog[];
}
